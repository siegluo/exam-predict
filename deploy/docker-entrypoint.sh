#!/bin/sh
# nginx envsubst entrypoint - generates nginx.conf from template
# Usage: entrypoint.sh <template_path> <output_path>

TEMPLATE="${1:-/etc/nginx/nginx.conf.template}"
OUTPUT="${2:-/etc/nginx/nginx.conf}"

# Substitute environment variables in template (only ${VAR} and $VAR patterns)
# Exclude empty vars to avoid breaking the config
envsubst '${ALLOWED_ORIGINS}' < "$TEMPLATE" > "$OUTPUT"

echo "[entrypoint] Generated $OUTPUT from template with ALLOWED_ORIGINS=${ALLOWED_ORIGINS:-<unset>}"

# Pass control to nginx
exec "$@"
