#!/bin/sh
set -eu

# Docker creates a new named-volume mount as root. Initialize only the gateway
# state directory, then drop privileges before the application process starts.
mkdir -p /data
chown node:node /data

exec setpriv --reuid=node --regid=node --init-groups "$@"
