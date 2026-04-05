#!/bin/sh
set -e

echo "==> Running prisma migrate deploy..."
npx prisma migrate deploy

echo "==> Checking if DB needs seeding..."
node scripts/seed-if-empty.js

echo "==> Starting NestJS..."
exec node dist/main
