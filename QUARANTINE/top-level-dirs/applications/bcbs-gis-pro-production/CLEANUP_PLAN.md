# Terrafusion Codebase Cleanup Plan

## Issues Identified
1. Multiple duplicate src/ directories (client/src + src/)
2. Redundant component structures
3. Multiple layout components with similar functionality
4. Unused libs/ directory structure
5. Browser script errors from configuration issues
6. Inconsistent file organization

## Cleanup Strategy
1. Consolidate all frontend code to client/src
2. Remove duplicate directories and files
3. Streamline component architecture
4. Fix configuration issues causing browser errors
5. Archive unused code properly
6. Optimize build process

## Target Architecture
- server/ - Backend API and services
- client/ - React frontend application
- shared/ - Shared types and schemas
- archive/ - Archived unused code