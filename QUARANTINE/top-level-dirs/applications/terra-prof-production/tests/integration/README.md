# TerraFusionPro Integration Tests

This directory contains integration tests for the TerraFusionPro platform.

## Overview

Integration tests verify that different parts of the system work together as expected.
These tests focus on testing the interactions between services, the API gateway, and
external dependencies.

## Test Structure

The integration tests are organized by domain:

- `property/`: Tests for property-related functionality
- `user/`: Tests for user management and authentication
- `form/`: Tests for form definition and processing
- `analysis/`: Tests for valuation and analysis
- `report/`: Tests for report generation

## Running Tests

To run all integration tests:

```bash
npm run test:integration
