#!/bin/sh
# Rebuilds a scratch database and runs the migration + RLS tests.
S="$(cd "$(dirname "$0")/.." && pwd)"
H="${PGHOST_ARGS:--h localhost -p 5432 -U postgres}"
psql $H -q -d postgres -c "drop database if exists reusedo_test" -c "create database reusedo_test" || exit 1
P="psql $H -v ON_ERROR_STOP=1 -q -d reusedo_test"
$P -f $S/tests/00_local_stubs.sql 2>&1 | grep -v "WARNING\|HINT"
$P -f $S/migrations/20261014000000_serverless_core.sql 2>&1 | grep -v NOTICE
$P -o /dev/null -f $S/tests/rls.test.sql 2>&1
