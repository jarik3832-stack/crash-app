#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
npm --prefix server install
npm --prefix client install --include=dev
npm --prefix client run build
