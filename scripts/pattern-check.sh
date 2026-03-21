#!/bin/bash
# =============================================================================
# Pattern Check - Pre-commit Defensive Pattern Analysis
# =============================================================================
# Fast static analysis (<5s) to catch defensive coding violations BEFORE commit.
# Uses grep-based pattern matching for speed.
#
# This script implements Step 1.8 patterns from /bs:quality for pre-commit use.
#
# INSTALLATION IN OTHER REPOS:
#   1. Copy this script to your repo: scripts/pattern-check.sh
#   2. Add to .husky/pre-commit:
#        #!/bin/sh
#        ./scripts/pattern-check.sh
#   3. Or install via:
#        npm pkg set scripts.pattern-check="bash scripts/pattern-check.sh"
#        npx husky add .husky/pre-commit "npm run pattern-check"
#
# CONFIGURATION:
#   Create .defensive-patterns.json in your project root to customize:
#   - authMiddleware: Custom auth function names (e.g., "protectedProcedure")
#   - safeParseHelpers: Custom safe parsing functions
#   - publicRoutes: Routes that don't require auth (glob patterns)
#   - disabled: Checks to skip entirely
#   See docs/defensive-patterns.md for full documentation.
#
# USAGE:
#   ./scripts/pattern-check.sh           # Check staged files
#   ./scripts/pattern-check.sh --all     # Check all tracked files
#   ./scripts/pattern-check.sh --fix     # Show violation locations for manual fix
#   git commit --no-pattern-check ...    # Emergency bypass (logged)
#
# EXIT CODES:
#   0 - No violations (or all low severity)
#   1 - Critical/High violations found - commit blocked
#   2 - Script error
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BYPASS_FLAG="--no-pattern-check"
BYPASS_LOG=".claude/bypass-log.json"
CONFIG_FILE=".defensive-patterns.json"
CHECK_ALL=false
SHOW_FIX=false

# Default patterns (used when no config file exists)
DEFAULT_AUTH_MIDDLEWARE="withAuth|requireAuth|authenticate|getSession|getServerSession"
DEFAULT_SAFE_PARSE="safe(Json)?Parse|\.safeParse"
DEFAULT_PUBLIC_ROUTES=""
DISABLED_CHECKS=""
EXCLUDE_PATHS_PATTERN=""

# Project-specific patterns (loaded from config)
AUTH_MIDDLEWARE_PATTERN=""
SAFE_PARSE_PATTERN=""
PUBLIC_ROUTES_PATTERN=""

# Parse arguments
for arg in "$@"; do
    case $arg in
        --all)
            CHECK_ALL=true
            ;;
        --fix)
            SHOW_FIX=true
            ;;
        --help|-h)
            echo "Usage: $0 [--all] [--fix] [--help]"
            echo ""
            echo "Options:"
            echo "  --all    Check all tracked files (not just staged)"
            echo "  --fix    Show file locations for manual fixing"
            echo "  --help   Show this help message"
            echo ""
            echo "Environment:"
            echo "  PATTERN_CHECK_SKIP=1    Skip pattern check (for CI or testing)"
            echo ""
            echo "Configuration:"
            echo "  Create .defensive-patterns.json to customize patterns."
            echo "  See docs/defensive-patterns.md for schema documentation."
            exit 0
            ;;
    esac
done

# Allow skipping in CI or when explicitly requested
if [[ "${PATTERN_CHECK_SKIP:-}" == "1" ]]; then
    echo -e "${BLUE}Pattern check skipped (PATTERN_CHECK_SKIP=1)${NC}"
    exit 0
fi

# Check for bypass flag in git command (via GIT_COMMIT_ARGS or similar)
if [[ "${GIT_COMMIT_NO_PATTERN_CHECK:-}" == "1" ]]; then
    log_bypass
    exit 0
fi

# Function to log bypass events
log_bypass() {
    local timestamp
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local user
    user=$(git config user.email 2>/dev/null || echo "unknown")
    local branch
    branch=$(git branch --show-current 2>/dev/null || echo "unknown")

    # Ensure .claude directory exists
    mkdir -p "$(dirname "$BYPASS_LOG")"

    # Create or append to bypass log
    if [[ ! -f "$BYPASS_LOG" ]]; then
        echo '{"bypasses":[]}' > "$BYPASS_LOG"
    fi

    # Add new entry using jq if available, otherwise use sed
    if command -v jq &> /dev/null; then
        local temp_file
        temp_file=$(mktemp)
        jq --arg ts "$timestamp" --arg user "$user" --arg branch "$branch" \
            '.bypasses += [{"timestamp": $ts, "user": $user, "branch": $branch}]' \
            "$BYPASS_LOG" > "$temp_file" && mv "$temp_file" "$BYPASS_LOG"
    else
        # Fallback: append to a simple text log
        echo "$timestamp | $user | $branch" >> "${BYPASS_LOG}.txt"
    fi

    echo -e "${YELLOW}Warning: Pattern check bypassed - logged to $BYPASS_LOG${NC}"
}

# Load project configuration
load_config() {
    if [[ ! -f "$CONFIG_FILE" ]]; then
        # Use defaults
        AUTH_MIDDLEWARE_PATTERN="$DEFAULT_AUTH_MIDDLEWARE"
        SAFE_PARSE_PATTERN="$DEFAULT_SAFE_PARSE"
        PUBLIC_ROUTES_PATTERN=""
        DISABLED_CHECKS=""
        return
    fi

    echo -e "${BLUE}Loading config from $CONFIG_FILE${NC}"

    # Check if jq is available
    if ! command -v jq &> /dev/null; then
        echo -e "${YELLOW}Warning: jq not found, using default patterns${NC}"
        AUTH_MIDDLEWARE_PATTERN="$DEFAULT_AUTH_MIDDLEWARE"
        SAFE_PARSE_PATTERN="$DEFAULT_SAFE_PARSE"
        return
    fi

    # Load authMiddleware array and convert to regex pattern
    local auth_array
    auth_array=$(jq -r '.authMiddleware // empty | @json' "$CONFIG_FILE" 2>/dev/null || true)
    if [[ -n "$auth_array" && "$auth_array" != "null" ]]; then
        AUTH_MIDDLEWARE_PATTERN=$(echo "$auth_array" | jq -r 'join("|")' 2>/dev/null || echo "$DEFAULT_AUTH_MIDDLEWARE")
    else
        AUTH_MIDDLEWARE_PATTERN="$DEFAULT_AUTH_MIDDLEWARE"
    fi

    # Load safeParseHelpers array and convert to regex pattern
    local safe_array
    safe_array=$(jq -r '.safeParseHelpers // empty | @json' "$CONFIG_FILE" 2>/dev/null || true)
    if [[ -n "$safe_array" && "$safe_array" != "null" ]]; then
        # Escape dots in method patterns and join with |
        SAFE_PARSE_PATTERN=$(echo "$safe_array" | jq -r 'map(gsub("\\."; "\\.")) | join("|")' 2>/dev/null || echo "$DEFAULT_SAFE_PARSE")
    else
        SAFE_PARSE_PATTERN="$DEFAULT_SAFE_PARSE"
    fi

    # Load publicRoutes array
    local routes_array
    routes_array=$(jq -r '.publicRoutes // empty | @json' "$CONFIG_FILE" 2>/dev/null || true)
    if [[ -n "$routes_array" && "$routes_array" != "null" ]]; then
        PUBLIC_ROUTES_PATTERN=$(echo "$routes_array" | jq -r 'join("|")' 2>/dev/null || echo "")
        # Convert glob patterns to regex: * -> [^/]*, ** -> .*
        PUBLIC_ROUTES_PATTERN=$(echo "$PUBLIC_ROUTES_PATTERN" | sed 's/\*\*/.__DOUBLE_STAR__./g' | sed 's/\*/[^\/]*/g' | sed 's/\.__DOUBLE_STAR__\./.\*/g')
    else
        PUBLIC_ROUTES_PATTERN=""
    fi

    # Load disabled checks
    local disabled_array
    disabled_array=$(jq -r '.disabled // empty | @json' "$CONFIG_FILE" 2>/dev/null || true)
    if [[ -n "$disabled_array" && "$disabled_array" != "null" ]]; then
        DISABLED_CHECKS=$(echo "$disabled_array" | jq -r 'join("|")' 2>/dev/null || echo "")
    else
        DISABLED_CHECKS=""
    fi

    # Load exclude paths
    local exclude_array
    exclude_array=$(jq -r '.excludePaths // empty | @json' "$CONFIG_FILE" 2>/dev/null || true)
    if [[ -n "$exclude_array" && "$exclude_array" != "null" ]]; then
        EXCLUDE_PATHS_PATTERN=$(echo "$exclude_array" | jq -r 'join("|")' 2>/dev/null || echo "")
        # Convert glob patterns to regex: * -> [^/]*, ** -> .*
        EXCLUDE_PATHS_PATTERN=$(echo "$EXCLUDE_PATHS_PATTERN" | sed 's/\*\*/.__DOUBLE_STAR__./g' | sed 's/\*/[^\/]*/g' | sed 's/\.__DOUBLE_STAR__\./.\*/g')
    else
        EXCLUDE_PATHS_PATTERN=""
    fi
}

# Check if a check is disabled
is_check_disabled() {
    local check_id="$1"
    if [[ -z "$DISABLED_CHECKS" ]]; then
        return 1  # Not disabled
    fi
    if echo "$check_id" | grep -qE "^($DISABLED_CHECKS)$"; then
        return 0  # Disabled
    fi
    return 1  # Not disabled
}

# Check if a file matches public routes pattern
is_public_route() {
    local file="$1"
    if [[ -z "$PUBLIC_ROUTES_PATTERN" ]]; then
        return 1  # No public routes configured
    fi
    if echo "$file" | grep -qE "$PUBLIC_ROUTES_PATTERN"; then
        return 0  # Is public route
    fi
    return 1  # Not public route
}

# Check if a file should be excluded from analysis
is_excluded_path() {
    local file="$1"
    if [[ -z "$EXCLUDE_PATHS_PATTERN" ]]; then
        return 1  # No exclusions configured
    fi
    if echo "$file" | grep -qE "$EXCLUDE_PATHS_PATTERN"; then
        return 0  # Should be excluded
    fi
    return 1  # Not excluded
}

# Get files to check
get_files_to_check() {
    local files=""

    if [[ "$CHECK_ALL" == "true" ]]; then
        # All tracked files
        files=$(git ls-files '*.ts' '*.tsx' '*.js' '*.jsx' 2>/dev/null || true)
    else
        # Only staged files
        files=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx)$' || true)
    fi

    echo "$files"
}

# Track violations
CRITICAL_COUNT=0
HIGH_COUNT=0
MEDIUM_COUNT=0
VIOLATIONS_FILE=$(mktemp)

# Cleanup temp file on exit
trap 'rm -f "$VIOLATIONS_FILE"' EXIT

# Add a violation
add_violation() {
    local severity="$1"
    local pattern="$2"
    local file="$3"
    local line="$4"
    local message="$5"

    case $severity in
        critical) ((CRITICAL_COUNT++)) || true ;;
        high)     ((HIGH_COUNT++)) || true ;;
        medium)   ((MEDIUM_COUNT++)) || true ;;
    esac

    printf '%s|%s|%s|%s|%s\n' "$severity" "$pattern" "$file" "$line" "$message" >> "$VIOLATIONS_FILE"
}

# Check for unsafe JSON.parse without try/catch or Zod
check_unsafe_parsing() {
    local file="$1"

    # Skip if check is disabled
    if is_check_disabled "UNSAFE_PARSING"; then
        return
    fi

    # Look for JSON.parse not wrapped in try or with safeParse
    while IFS=: read -r line_num line_content; do
        # Skip if using configured safe parse patterns
        if echo "$line_content" | grep -qiE "$SAFE_PARSE_PATTERN"; then
            continue
        fi

        # Check if this line is inside a try block by counting braces
        # Look at all lines from start to this line and track try/catch scope
        local in_try_block
        in_try_block=$(awk -v target="$line_num" '
        BEGIN { in_try = 0; brace_depth = 0 }
        NR <= target {
            # Match "try {" or "try{" with optional whitespace
            if (/try[ \t]*\{/) {
                in_try = 1
                brace_depth = 1
            } else if (in_try) {
                brace_depth += gsub(/{/, "{")
                brace_depth -= gsub(/}/, "}")
                if (brace_depth <= 0) {
                    in_try = 0
                }
            }
        }
        END { print in_try }
        ' "$file" 2>/dev/null)

        if [[ "$in_try_block" != "1" ]]; then
            add_violation "high" "UNSAFE_PARSING" "$file" "$line_num" "JSON.parse without try/catch or Zod validation"
        fi
    done < <(grep -n 'JSON\.parse\s*(' "$file" 2>/dev/null || true)
}

# Check for empty catch blocks
check_empty_catches() {
    local file="$1"

    # Skip if check is disabled
    if is_check_disabled "EMPTY_CATCH"; then
        return
    fi

    # Pattern: catch blocks with only whitespace, console.log, or nothing
    while IFS=: read -r line_num line_content; do
        add_violation "high" "EMPTY_CATCH" "$file" "$line_num" "Empty or silent catch block (console.log only)"
    done < <(grep -n -E 'catch\s*\([^)]*\)\s*\{\s*(\/\/.*)?(\s*console\.(log|warn|error)[^}]*)?\s*\}' "$file" 2>/dev/null || true)

    # Also check multiline empty catches - look for catch followed by just }
    # Using awk for multiline pattern matching
    awk '
    /catch\s*\([^)]*\)\s*\{/ {
        catch_line = NR
        in_catch = 1
        brace_count = gsub(/{/, "{") - gsub(/}/, "}")
        next
    }
    in_catch {
        brace_count += gsub(/{/, "{") - gsub(/}/, "}")
        if (brace_count <= 0) {
            # Check if body is essentially empty
            if (NR - catch_line <= 2) {
                print catch_line
            }
            in_catch = 0
        }
    }
    ' "$file" 2>/dev/null | while read -r line_num; do
        add_violation "high" "EMPTY_CATCH" "$file" "$line_num" "Catch block with no meaningful error handling"
    done
}

# Check for missing auth in API routes
check_missing_auth() {
    local file="$1"

    # Skip if check is disabled
    if is_check_disabled "MISSING_AUTH"; then
        return
    fi

    # Only check API route files
    if ! echo "$file" | grep -qE '(api|route)\.(ts|js)$|/api/'; then
        return
    fi

    # Skip if file matches public routes pattern
    if is_public_route "$file"; then
        return
    fi

    # Skip if file has PUBLIC ROUTE comment or is explicitly public
    if grep -q 'PUBLIC.ROUTE\|@public\|isPublic.*true' "$file" 2>/dev/null; then
        return
    fi

    # Check for route handlers without auth wrapper using configured patterns
    while IFS=: read -r line_num line_content; do
        # Skip if wrapped in configured auth middleware
        if ! grep -qE "$AUTH_MIDDLEWARE_PATTERN" "$file" 2>/dev/null; then
            add_violation "critical" "MISSING_AUTH" "$file" "$line_num" "API route without auth middleware"
        fi
    done < <(grep -n -E 'export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)' "$file" 2>/dev/null || true)

    # Also check for Next.js 13+ route exports
    while IFS=: read -r line_num line_content; do
        if ! grep -qE "$AUTH_MIDDLEWARE_PATTERN" "$file" 2>/dev/null; then
            add_violation "critical" "MISSING_AUTH" "$file" "$line_num" "API route handler without auth"
        fi
    done < <(grep -n -E 'export\s+const\s+(GET|POST|PUT|DELETE|PATCH)\s*=' "$file" 2>/dev/null || true)
}

# Check for inline arrow handlers in JSX (useCallback violation)
check_inline_handlers() {
    local file="$1"

    # Skip if check is disabled
    if is_check_disabled "INLINE_HANDLER"; then
        return
    fi

    # Only check React component files
    if ! echo "$file" | grep -qE '\.(tsx|jsx)$'; then
        return
    fi

    # Count inline arrow functions in event handlers
    local inline_count
    inline_count=$(grep -c -E 'on[A-Z][a-zA-Z]*=\{[^}]*\(\s*\)\s*=>' "$file" 2>/dev/null || echo "0")

    if [[ "$inline_count" -gt 3 ]]; then
        # Report first occurrence
        local first_line
        first_line=$(grep -n -E 'on[A-Z][a-zA-Z]*=\{[^}]*\(\s*\)\s*=>' "$file" 2>/dev/null | head -1 | cut -d: -f1)
        add_violation "medium" "INLINE_HANDLER" "$file" "${first_line:-1}" "$inline_count inline arrow handlers (use useCallback)"
    fi
}

# Check for division without zero check
check_division_guards() {
    local file="$1"

    # Skip if check is disabled
    if is_check_disabled "DIVISION_GUARD"; then
        return
    fi

    # Look for division operations
    while IFS=: read -r line_num line_content; do
        # Skip if there's a guard (ternary with > 0 or !== 0)
        if ! echo "$line_content" | grep -qE '>\s*0\s*\?|!==?\s*0\s*\?|&&.*\/'; then
            # Check previous lines for guard
            local start_line=$((line_num > 3 ? line_num - 3 : 1))
            local context
            context=$(sed -n "${start_line},${line_num}p" "$file" 2>/dev/null || true)

            if ! echo "$context" | grep -qE 'if\s*\([^)]*>\s*0|if\s*\([^)]*!==?\s*0'; then
                add_violation "medium" "DIVISION_GUARD" "$file" "$line_num" "Division without zero check"
            fi
        fi
    done < <(grep -n -E '[^/]/\s*[a-zA-Z_][a-zA-Z0-9_]*\s*[;,)]' "$file" 2>/dev/null | grep -v '//' | grep -v '/*' || true)
}

# Print results
print_results() {
    if [[ $CRITICAL_COUNT -eq 0 && $HIGH_COUNT -eq 0 && $MEDIUM_COUNT -eq 0 ]]; then
        echo -e "${GREEN}All defensive patterns verified${NC}"
        return 0
    fi

    echo ""
    echo -e "${RED}=== Pattern Analysis Violations ===${NC}"
    echo ""

    # Print violations grouped by severity
    while IFS='|' read -r severity pattern file line message; do
        [[ -z "$severity" ]] && continue

        local color
        case $severity in
            critical) color="$RED" ;;
            high)     color="$RED" ;;
            medium)   color="$YELLOW" ;;
            *)        color="$NC" ;;
        esac

        echo -e "${color}[$severity]${NC} $pattern"
        echo "  File: $file:$line"
        echo "  Issue: $message"
        echo ""
    done < "$VIOLATIONS_FILE"

    echo "==================================="
    echo -e "Summary: ${RED}$CRITICAL_COUNT critical${NC}, ${RED}$HIGH_COUNT high${NC}, ${YELLOW}$MEDIUM_COUNT medium${NC}"
    echo ""

    if [[ $CRITICAL_COUNT -gt 0 || $HIGH_COUNT -gt 0 ]]; then
        echo -e "${RED}Commit blocked: Fix critical/high violations first${NC}"
        echo ""
        echo "Options:"
        echo "  1. Fix the violations above"
        echo "  2. Emergency bypass: GIT_COMMIT_NO_PATTERN_CHECK=1 git commit ..."
        echo "     (Bypasses are logged to $BYPASS_LOG)"
        return 1
    else
        echo -e "${YELLOW}Warning: Medium severity violations found (commit allowed)${NC}"
        return 0
    fi
}

# Main execution
main() {
    local start_time
    start_time=$(date +%s)

    echo -e "${BLUE}Running defensive pattern analysis...${NC}"

    # Load project configuration
    load_config

    # Get files to check
    local files
    files=$(get_files_to_check)

    if [[ -z "$files" ]]; then
        echo -e "${GREEN}No JS/TS files to check${NC}"
        exit 0
    fi

    local file_count
    file_count=$(echo "$files" | wc -l | tr -d ' ')
    echo "Checking $file_count files..."

    # Run checks on each file
    while IFS= read -r file; do
        [[ -z "$file" ]] && continue
        [[ ! -f "$file" ]] && continue

        # Skip files matching exclude patterns
        if is_excluded_path "$file"; then
            continue
        fi

        check_unsafe_parsing "$file"
        check_empty_catches "$file"
        check_missing_auth "$file"
        check_inline_handlers "$file"
        check_division_guards "$file"
    done <<< "$files"

    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))

    echo "Analysis completed in ${duration}s"
    echo ""

    # Record metrics (CS-088)
    record_metrics

    # Print results and exit with appropriate code
    print_results
}

# Record violation metrics for tracking (CS-088)
record_metrics() {
    # Find the metrics script
    local script_dir
    script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local metrics_script="$script_dir/pattern-metrics.sh"

    # Also check claude-setup location
    if [[ ! -f "$metrics_script" ]]; then
        metrics_script="${HOME}/Projects/claude-setup/scripts/pattern-metrics.sh"
    fi

    if [[ ! -f "$metrics_script" ]] || [[ ! -x "$metrics_script" ]]; then
        return 0  # Silent skip if metrics not available
    fi

    # Count violations by pattern type
    local unsafe_parsing=0 empty_catch=0 missing_auth=0 inline_handler=0 division_guard=0

    while IFS='|' read -r severity pattern file line message; do
        [[ -z "$severity" ]] && continue
        case "$pattern" in
            UNSAFE_PARSING) ((unsafe_parsing++)) || true ;;
            EMPTY_CATCH)    ((empty_catch++)) || true ;;
            MISSING_AUTH)   ((missing_auth++)) || true ;;
            INLINE_HANDLER) ((inline_handler++)) || true ;;
            DIVISION_GUARD) ((division_guard++)) || true ;;
        esac
    done < "$VIOLATIONS_FILE"

    # Build JSON and record
    local violations_json
    violations_json=$(cat << EOF
{
    "UNSAFE_PARSING": $unsafe_parsing,
    "EMPTY_CATCH": $empty_catch,
    "MISSING_AUTH": $missing_auth,
    "INLINE_HANDLER": $inline_handler,
    "DIVISION_GUARD": $division_guard
}
EOF
)

    "$metrics_script" record "$violations_json" 2>/dev/null || true
}

main "$@"
