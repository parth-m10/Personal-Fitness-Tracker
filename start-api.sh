#!/bin/bash
export $(grep -v '^#' .env | xargs)
export PORT=8080
pnpm --filter @workspace/api-server run dev
