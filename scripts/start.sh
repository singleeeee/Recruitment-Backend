#!/bin/sh
set -e

echo "==> Running prisma db push..."
npx prisma db push --accept-data-loss

echo "==> Checking if DB needs seeding..."
node scripts/seed-if-empty.js

echo "==> Starting NestJS..."
exec node dist/main
