# TerraFusionPro API Documentation

This directory contains documentation for the TerraFusionPro API, including endpoints,
request/response formats, and authentication methods.

## API Overview

TerraFusionPro exposes a RESTful API for interacting with the platform. All API
endpoints are accessible through the API Gateway at `https://api.terrafusionpro.com`.

## Authentication

All API requests (except public endpoints) require authentication. Authentication
is handled using JSON Web Tokens (JWT) that should be included in the Authorization
header:

