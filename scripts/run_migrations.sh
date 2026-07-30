#!/usr/bin/env bash
# Helper script to run DB migrations and optional seed on a remote DB.
# Usage: set env vars (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET) then run this script.

set -euo pipefail

echo "Installing dependencies..."
cd "$(dirname "${BASH_SOURCE[0]}")/.."
npm ci

echo "Running DB migrations..."
npm run db:migrate

echo "(Optional) Running DB init/seed..."
echo "If you want to seed sample data, run: npm run db:init"

echo "Migrations complete."
