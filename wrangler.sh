#!/usr/bin/env bash
#
# Runs the wrangler pinned in packages/pwa rather than `pnpm dlx wrangler`, which
# resolves to whatever is latest on the registry. Every argument is passed through
# untouched, and the command runs inside packages/pwa so wrangler.jsonc is picked up.
#
#   ./wrangler.sh deployments status
#   ./wrangler.sh versions list
#   ./wrangler.sh rollback
#
# The Cloudflare token comes from the .cf file in this directory, matching the
# deploy scripts in packages/pwa. If .cf is absent the environment is used instead.

set -euo pipefail

root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
self="$(basename -- "${BASH_SOURCE[0]}")"

if [[ -f "$root/.cf" ]]; then
	source "$root/.cf"
fi

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
	echo "Error: CLOUDFLARE_API_TOKEN is not set (create .cf file)" >&2
	exit 78
fi

exec pnpm --filter @dh-care-plan/pwa exec wrangler "$@"
