#!/usr/bin/env bash
#
# Run E2E tests (or update snapshots) against multiple Astro major versions.
#
# Usage:
#   ./scripts/test-all-versions.sh              # run tests for all versions
#   ./scripts/test-all-versions.sh --update     # update snapshots for all versions
#   ./scripts/test-all-versions.sh --versions 3 5  # only test Astro 3 and 5
#   ./scripts/test-all-versions.sh --update --versions 4  # update snapshots for Astro 4 only
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEST_APP_DIR="$REPO_ROOT/test-app"
PKG_DIR="$REPO_ROOT/imagekit-astro"

# --- Parse arguments ---
UPDATE_SNAPSHOTS=false
VERSIONS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --update)
      UPDATE_SNAPSHOTS=true
      shift
      ;;
    --versions)
      shift
      while [[ $# -gt 0 && ! "$1" =~ ^-- ]]; do
        VERSIONS+=("$1")
        shift
      done
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--update] [--versions 3 4 5 6]"
      exit 1
      ;;
  esac
done

# Default: all supported versions
if [[ ${#VERSIONS[@]} -eq 0 ]]; then
  VERSIONS=("3" "4" "5" "6")
fi

# --- Adapter lookup ---
get_adapter() {
  local v="$1"
  case "$v" in
    3) echo "@astrojs/node@^6" ;;
    4) echo "@astrojs/node@^8" ;;
    5) echo "@astrojs/node@^9" ;;
    6) echo "@astrojs/node@^10" ;;
    *) echo "@astrojs/node@latest" ;;
  esac
}

# --- Build & pack the package once ---
echo "==> Building @imagekit/astro..."
(cd "$PKG_DIR" && pnpm build)

echo "==> Packing @imagekit/astro..."
(cd "$PKG_DIR" && pnpm pack)
TARBALL=$(ls "$PKG_DIR"/imagekit-astro-*.tgz | head -1)

if [[ ! -f "$TARBALL" ]]; then
  echo "ERROR: tarball not found in $PKG_DIR"
  exit 1
fi

echo "   Tarball: $TARBALL"

# --- Save original test-app deps so we can restore later ---
ORIG_PACKAGE_JSON=$(cat "$TEST_APP_DIR/package.json")

restore_deps() {
  echo "==> Restoring original test-app/package.json..."
  echo "$ORIG_PACKAGE_JSON" > "$TEST_APP_DIR/package.json"
  (cd "$TEST_APP_DIR" && pnpm install --silent --no-frozen-lockfile 2>/dev/null) || true
  # Clean up tarball
  rm -f "$PKG_DIR"/imagekit-astro-*.tgz
}
trap restore_deps EXIT

# --- Install Playwright browsers (once) ---
echo "==> Installing Playwright browsers..."
(cd "$TEST_APP_DIR" && pnpm exec playwright install --with-deps)

# --- Run for each version ---
FAILED_VERSIONS=()

echo "********************************************"
echo "     Running tests for versions: ${VERSIONS[*]}"
echo "********************************************"

  
for VERSION in "${VERSIONS[@]}"; do
  ADAPTER=$(get_adapter "$VERSION")
  echo ""
  echo "============================================"
  echo "  Astro $VERSION  (adapter: $ADAPTER)"
  echo "============================================"

  # Install version-specific deps
  echo "==> Installing astro@$VERSION and $ADAPTER in test-app..."
  (
    cd "$TEST_APP_DIR"
    pnpm remove --silent @imagekit/astro 2>/dev/null || true
    pnpm add --silent "$TARBALL"
    pnpm remove --silent "@astrojs/node" 2>/dev/null || true
    pnpm add --silent "astro@$VERSION"
    pnpm add --silent "$ADAPTER"
  )

  # Choose test command
  if $UPDATE_SNAPSHOTS; then
    TEST_CMD="pnpm test:e2e-update"
  else
    TEST_CMD="pnpm test:e2e"
  fi

  echo "==> Running: ASTRO_VERSION=$VERSION $TEST_CMD"
  if (cd "$TEST_APP_DIR" && ASTRO_VERSION="$VERSION" $TEST_CMD); then
    echo "==> Astro $VERSION: PASSED"
  else
    echo "==> Astro $VERSION: FAILED"
    FAILED_VERSIONS+=("$VERSION")
  fi
done

# --- Summary ---
echo ""
echo "============================================"
echo "  Summary"
echo "============================================"
echo "  Versions tested: ${VERSIONS[*]}"

if [[ ${#FAILED_VERSIONS[@]} -eq 0 ]]; then
  echo "  Result: ALL PASSED"
else
  echo "  Failed: ${FAILED_VERSIONS[*]}"
  exit 1
fi
