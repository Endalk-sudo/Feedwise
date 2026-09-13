#!/bin/sh
# Render/compose runtime templating for the nginx frontend.
# Substitutes ONLY ${PORT} and ${BACKEND_URL} so nginx variables
# ($host, $http_upgrade, $uri, ...) pass through untouched.
# Executed automatically by the nginx image's /docker-entrypoint.d runner.
set -eu

: "${BACKEND_URL:=http://server:5000}"
: "${PORT:=80}"

envsubst '${PORT} ${BACKEND_URL}' \
  < /etc/nginx/feedwise-default.conf.tmpl \
  > /etc/nginx/conf.d/default.conf
