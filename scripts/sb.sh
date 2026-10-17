#!/usr/bin/env bash
# Runs the Supabase CLI with the personal access token from ./.secret exported as SUPABASE_ACCESS_TOKEN.
# The token is only ever held in this process's environment — never printed or written elsewhere.
# .secret format: "SUPABASE_ACCESS_TOKEN: sbp_..."
set -euo pipefail
cd "$(dirname "$0")/.."
SUPABASE_ACCESS_TOKEN="$(sed -E 's/^[^:]*:[[:space:]]*//' .secret | tr -d '\r\n[:space:]')"
export SUPABASE_ACCESS_TOKEN
exec npx --yes supabase@latest "$@"
