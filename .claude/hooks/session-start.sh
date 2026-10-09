#!/bin/bash
set -euo pipefail

# Solo ejecutar en sesiones remotas (Claude Code en la web)
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# npm install (no ci) para aprovechar la caché del contenedor
npm install --no-audit --no-fund
