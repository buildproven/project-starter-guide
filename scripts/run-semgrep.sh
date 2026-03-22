#!/bin/bash
# =============================================================================
# Run Semgrep - Defensive Pattern Security Scan
# =============================================================================
# Runs Semgrep with defensive pattern rules. Falls back to LLM analysis
# if Semgrep is not installed.
#
# Part of CS-090: Semgrep Integration for Patterns
#
# USAGE:
#   ./scripts/run-semgrep.sh              # Scan current directory
#   ./scripts/run-semgrep.sh --install    # Install semgrep
#   ./scripts/run-semgrep.sh --ci         # CI mode (exit codes)
#   ./scripts/run-semgrep.sh src/         # Scan specific directory
# =============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SEMGREP_CONFIG=".semgrep/defensive-patterns.yaml"
CI_MODE=false
INSTALL_MODE=false
SCAN_DIR="."
OUTPUT_FORMAT="text"
OUTPUT_FILE=""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --install)
      INSTALL_MODE=true
      shift
      ;;
    --ci)
      CI_MODE=true
      OUTPUT_FORMAT="json"
      shift
      ;;
    --json)
      OUTPUT_FORMAT="json"
      shift
      ;;
    --sarif)
      OUTPUT_FORMAT="sarif"
      shift
      ;;
    --output|-o)
      OUTPUT_FILE="$2"
      shift 2
      ;;
    --config|-c)
      SEMGREP_CONFIG="$2"
      shift 2
      ;;
    --help|-h)
      echo "Usage: run-semgrep.sh [OPTIONS] [DIRECTORY]"
      echo ""
      echo "Options:"
      echo "  --install    Install semgrep via pip"
      echo "  --ci         CI mode (json output, proper exit codes)"
      echo "  --json       Output as JSON"
      echo "  --sarif      Output as SARIF (for GitHub Security)"
      echo "  --output     Write output to file"
      echo "  --config     Custom semgrep config (default: .semgrep/defensive-patterns.yaml)"
      echo "  --help       Show this help message"
      echo ""
      echo "Examples:"
      echo "  run-semgrep.sh                     # Scan current dir"
      echo "  run-semgrep.sh --install           # Install semgrep"
      echo "  run-semgrep.sh --ci --output report.json"
      exit 0
      ;;
    -*)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
    *)
      SCAN_DIR="$1"
      shift
      ;;
  esac
done

# Install semgrep if requested
if [[ "$INSTALL_MODE" == "true" ]]; then
  echo -e "${BLUE}Installing Semgrep...${NC}"

  if command -v pip3 &> /dev/null; then
    pip3 install semgrep
  elif command -v pip &> /dev/null; then
    pip install semgrep
  elif command -v brew &> /dev/null; then
    brew install semgrep
  else
    echo -e "${RED}Error: No package manager found (pip3, pip, or brew)${NC}"
    echo "Install manually: https://semgrep.dev/docs/getting-started/"
    exit 1
  fi

  echo -e "${GREEN}✓ Semgrep installed${NC}"
  exit 0
fi

# Check if semgrep is installed
check_semgrep() {
  if ! command -v semgrep &> /dev/null; then
    return 1
  fi
  return 0
}

# Find the config file
find_config() {
  # Check local project first
  if [[ -f "$SEMGREP_CONFIG" ]]; then
    echo "$SEMGREP_CONFIG"
    return 0
  fi

  # Check claude-setup
  local setup_config="$PROJECT_ROOT/.semgrep/defensive-patterns.yaml"
  if [[ -f "$setup_config" ]]; then
    echo "$setup_config"
    return 0
  fi

  # Check home directory
  local home_config="$HOME/.claude/.semgrep/defensive-patterns.yaml"
  if [[ -f "$home_config" ]]; then
    echo "$home_config"
    return 0
  fi

  return 1
}

# Run semgrep scan
run_semgrep() {
  local config_path="$1"
  local scan_path="$2"

  echo -e "${BLUE}🔍 Running Semgrep Security Scan${NC}"
  echo "═══════════════════════════════════════════════════════════"
  echo ""
  echo "Config: $config_path"
  echo "Scanning: $scan_path"
  echo ""

  local semgrep_args=(
    "--config" "$config_path"
    "--exclude" "node_modules"
    "--exclude" "dist"
    "--exclude" "build"
    "--exclude" ".next"
    "--exclude" "coverage"
    "--exclude" "*.min.js"
    "--exclude" "*.bundle.js"
  )

  # Add output format
  case "$OUTPUT_FORMAT" in
    json)
      semgrep_args+=("--json")
      ;;
    sarif)
      semgrep_args+=("--sarif")
      ;;
  esac

  # Add output file
  if [[ -n "$OUTPUT_FILE" ]]; then
    semgrep_args+=("--output" "$OUTPUT_FILE")
  fi

  # Run semgrep
  local exit_code=0
  semgrep "${semgrep_args[@]}" "$scan_path" || exit_code=$?

  echo ""

  if [[ $exit_code -eq 0 ]]; then
    echo -e "${GREEN}✅ No security issues found${NC}"
  elif [[ $exit_code -eq 1 ]]; then
    echo -e "${YELLOW}⚠️  Security findings detected${NC}"
    if [[ "$CI_MODE" == "true" ]]; then
      echo "Review findings above and fix before merging."
    fi
  else
    echo -e "${RED}❌ Semgrep scan failed (exit code: $exit_code)${NC}"
  fi

  return $exit_code
}

# Fallback LLM analysis when semgrep not available
fallback_llm_analysis() {
  echo -e "${YELLOW}⚠️  Semgrep not installed - using LLM-based analysis${NC}"
  echo ""
  echo "For faster, more reliable scans, install Semgrep:"
  echo "  ./scripts/run-semgrep.sh --install"
  echo ""
  echo "Falling back to pattern-check.sh..."
  echo ""

  # Run the grep-based pattern checker
  if [[ -f "$SCRIPT_DIR/pattern-check.sh" ]]; then
    bash "$SCRIPT_DIR/pattern-check.sh" --all
    return $?
  else
    echo -e "${RED}Error: pattern-check.sh not found${NC}"
    return 1
  fi
}

# Main
main() {
  if ! check_semgrep; then
    fallback_llm_analysis
    return $?
  fi

  local config_path
  if ! config_path=$(find_config); then
    echo -e "${RED}Error: Semgrep config not found at $SEMGREP_CONFIG${NC}"
    echo ""
    echo "Create .semgrep/defensive-patterns.yaml or specify with --config"
    exit 1
  fi

  run_semgrep "$config_path" "$SCAN_DIR"
}

main
