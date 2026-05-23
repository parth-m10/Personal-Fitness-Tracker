#!/bin/bash
export PORT=5173
export BASE_PATH="/"
pnpm --filter @workspace/fitness-tracker run dev
