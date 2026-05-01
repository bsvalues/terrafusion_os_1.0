@echo off
:: TerraFusion Local Agent — Windows CMD wrapper
:: Usage: tf <command> [args...]
:: Example: tf init | tf doctor | tf start | tf events | tf release
::
:: Requires Node.js. Run from the repo root or any subdirectory.
node "%~dp0local-agent\cli.js" %*
