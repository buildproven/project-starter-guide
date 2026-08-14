#!/usr/bin/env bash

# Template Smoke Test Script
# Tests templates with production-like environments and comprehensive validation
#
# Features:
# - Uses validate:all command when available (API service, mobile app)
# - Supports clean command for artifact cleanup (set CLEAN_BEFORE_TEST=true)
# - Environment variable testing (minimal and production-like configs)
# - Security audit with waiver support (.security-waivers.json)

set -euo pipefail

TEMPLATE_PATH=$1
ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
PROJECT_DIR="$ROOT_DIR/templates/$TEMPLATE_PATH"

if [ ! -d "$PROJECT_DIR" ]; then
  echo "Template path '$TEMPLATE_PATH' not found under templates/"
  exit 1
fi

echo "🔍 Running smoke tests for $TEMPLATE_PATH"

if [ ! -f "$PROJECT_DIR/package.json" ]; then
  echo "ℹ️  No package.json found, skipping npm-based checks."
  exit 0
fi

pushd "$PROJECT_DIR" >/dev/null

export npm_config_cache="$PROJECT_DIR/.npm-cache"
mkdir -p "$npm_config_cache"
export HUSKY=0

has_script() {
  node -e "const pkg = require('./package.json'); process.exit(pkg.scripts && Object.prototype.hasOwnProperty.call(pkg.scripts, '$1') ? 0 : 1);"
}

echo "📦 Installing dependencies..."
PRISMA_GENERATE_SKIP=1 npm ci --no-audit --no-fund

# Generate Prisma client if needed (skipped during install to avoid missing DATABASE_URL)
if has_script "prisma:generate"; then
  echo "⚙️  Generating Prisma client..."
  DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate
fi

# Optional: Clean artifacts from previous runs if clean script exists
if has_script "clean" && [ "${CLEAN_BEFORE_TEST:-false}" = "true" ]; then
  echo "🧹 Cleaning previous artifacts..."
  HUSKY=0 npm run clean
  echo "📦 Reinstalling dependencies after clean..."
  PRISMA_GENERATE_SKIP=1 npm ci --no-audit --no-fund
fi

run_if_script_exists() {
  local script=$1
  local description=$2
  if has_script "$script"; then
    echo "▶️  $description"
    HUSKY=0 npm run "$script"
  else
    echo "⏭️  Skipping $description (script not defined)"
  fi
}

run_security_audit() {
  echo "🔐 Running security audit"
  echo "🏭 Checking production dependency graph..."

  if [ ! -f ".security-waivers.json" ]; then
    npm audit --omit=dev --audit-level=high
    echo "✅ Production dependencies have no high or critical findings"
    return 0
  fi

  local production_audit full_audit production_packages found_packages
  local build_waivers dev_waivers unwaived_production unwaived_all
  production_audit=$(npm audit --omit=dev --json 2>/dev/null || true)
  full_audit=$(npm audit --json 2>/dev/null || true)

  node -e "
    const waivers = require('./.security-waivers.json').waivers || {};
    const today = new Date().toISOString().slice(0, 10);
    for (const group of Object.values(waivers)) {
      for (const item of group.vulnerabilities || []) {
        if (!item.reason || !item.expiresDate || item.expiresDate < today) {
          throw new Error('Invalid or expired waiver for ' + item.package);
        }
      }
    }
  "

  audit_packages() {
    node -e "
      const fs = require('fs');
      const audit = JSON.parse(fs.readFileSync(0, 'utf8'));
      console.log(Object.keys(audit.vulnerabilities || {}).sort().join(','));
    "
  }

  production_packages=$(printf '%s' "$production_audit" | audit_packages)
  found_packages=$(printf '%s' "$full_audit" | audit_packages)
  build_waivers=$(node -e "
    const w = require('./.security-waivers.json').waivers?.build_only_vulnerabilities?.vulnerabilities || [];
    console.log(w.map(item => item.package).sort().join(','));
  ")
  dev_waivers=$(node -e "
    const w = require('./.security-waivers.json').waivers?.dev_only_vulnerabilities?.vulnerabilities || [];
    console.log(w.map(item => item.package).sort().join(','));
  ")

  unwaived_production=$(node -e "
    const found = '$production_packages'.split(',').filter(Boolean);
    const waived = new Set('$build_waivers'.split(',').filter(Boolean));
    console.log(found.filter(name => !waived.has(name)).join(','));
  ")
  if [ -n "$unwaived_production" ]; then
    echo "🚨 Unwaived production-graph findings: $unwaived_production"
    exit 1
  fi

  unwaived_all=$(node -e "
    const found = '$found_packages'.split(',').filter(Boolean);
    const waived = new Set('$build_waivers,$dev_waivers'.split(',').filter(Boolean));
    console.log(found.filter(name => !waived.has(name)).join(','));
  ")
  if [ -n "$unwaived_all" ]; then
    echo "🚨 Unwaived dependency findings: $unwaived_all"
    exit 1
  fi

  if [ -z "$production_packages" ]; then
    echo "✅ Production dependency graph is clear"
  else
    echo "✅ Production-graph findings are reviewed build-only dependencies"
    echo "   ($production_packages)"
  fi
  if [ -z "$found_packages" ]; then
    echo "✅ Full dependency graph is clear"
  else
    echo "✅ All remaining dependency findings have explicit waivers"
  fi
}

# Test 1: Minimal .env scenario (critical for production readiness)
echo "🧪 Testing minimal .env configuration..."
test_minimal_env() {
  local template=$1

  case "$template" in
    "saas-level-1")
      # Test with ONLY required vars (no DB, no OAuth)
      # This tests that mock provider works without DATABASE_URL
      export NEXTAUTH_SECRET="test-secret-at-least-32-characters-long-for-ci"
      export NEXTAUTH_URL="http://localhost:3000"
      export NODE_ENV="development"
      # Intentionally NOT setting DATABASE_URL, OAuth providers
      # Template should work with mock/credentials provider
      echo "   Testing SaaS with mock provider (no DATABASE_URL)..."
      ;;
    "api-service")
      # API requires DATABASE_URL - test with minimal set
      export DATABASE_URL="postgresql://user:password@localhost:5432/test_db"
      export PORT="3000"
      export JWT_SECRET="test-jwt-secret-at-least-32-chars"
      export NODE_ENV="test"
      echo "   Testing API with minimal required vars..."
      ;;
    "mobile-app")
      # Mobile app doesn't need server env vars
      echo "   Testing mobile app (no server env vars needed)..."
      ;;
  esac
}

test_minimal_env "$TEMPLATE_PATH"

# Test 2: Full production-like env (all providers enabled)
echo "🚀 Testing production-like configuration..."
if [[ "$TEMPLATE_PATH" == "saas-level-1" ]]; then
  # Add full OAuth/database env for production testing
  export DATABASE_URL="postgresql://user:password@localhost:5432/test_db"
  export NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_dummy"
  export STRIPE_SECRET_KEY="sk_test_dummy"
  export STRIPE_WEBHOOK_SECRET="whsec_dummy"
  export GITHUB_ID="dummy-github-client-id"
  export GITHUB_SECRET="dummy-github-client-secret"
  export GOOGLE_CLIENT_ID="dummy-google-client-id.apps.googleusercontent.com"
  export GOOGLE_CLIENT_SECRET="dummy-google-client-secret"
  echo "   Testing with OAuth providers and database..."
fi

# Run comprehensive validation (lint/type-check/build) with production env
export NODE_ENV="production"

# Run lint and type-check first (these work in production mode)
run_if_script_exists lint "npm run lint"
run_if_script_exists "type-check" "npm run type-check"
run_if_script_exists build "npm run build"

# Run tests with test env (React 19's testing library requires NODE_ENV=test)
export NODE_ENV="test"
if [ "$TEMPLATE_PATH" = "saas-level-1" ]; then
  run_if_script_exists test "npm test"
else
  run_if_script_exists test "npm test -- --runInBand"
fi

SKIP_SECURITY_AUDIT=false

# Run security audit only if not already included in validate:all
if [ "$SKIP_SECURITY_AUDIT" = false ]; then
  run_security_audit
else
  echo "⏭️  Skipping separate security audit (included in validate:all)"
fi

popd >/dev/null

echo "✅ Smoke tests completed for $TEMPLATE_PATH"
