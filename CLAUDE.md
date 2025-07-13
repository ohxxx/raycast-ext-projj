# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Raycast extension for [projj](https://github.com/popomore/projj), a local project management tool. The extension provides two main commands:

1. **List Projects** (`src/list.tsx`): Browse all projects managed by projj with actions to open in Cursor, Terminal, and Finder
2. **Clone Repository** (`src/clone.tsx`): Clone Git repositories directly to projj-managed directories

## Development Commands

- `pnpm run dev` - Start development mode with hot reload
- `pnpm run build` - Build the extension for production
- `pnpm run lint` - Run ESLint to check code quality
- `pnpm run fix-lint` - Auto-fix linting issues
- `pnpm run publish` - Publish to Raycast Store

## Architecture

### Core Files
- `src/utils.ts`: Contains all shared utilities including projj config/cache loading, external app integration (Cursor, Warp terminal), and project metadata extraction
- `src/const.ts`: SVG icon definitions for UI elements
- `src/list.tsx`: Main project listing interface with action panel
- `src/clone.tsx`: Repository cloning form with environment validation

### Key Concepts
- **projj Integration**: Reads from `~/.projj/config.json` and `~/.projj/cache.json` 
- **External Apps**: Opens projects in Cursor (via `code` command) and Warp terminal
- **Environment Validation**: Checks for projj installation and configuration before allowing operations
- **Project Metadata**: Extracts owner names from Git URLs and file paths for better project identification

### Data Flow
1. Extensions check projj installation and config on startup
2. Cache data is loaded from `~/.projj/cache.json` and parsed into `ProjjCacheItem[]`
3. UI displays projects with actions that execute shell commands via `execAsync`

## Dependencies
- `@raycast/api`: Core Raycast extension API
- `@raycast/utils`: Additional Raycast utilities
- Uses Node.js built-ins: `fs`, `path`, `os`, `child_process`