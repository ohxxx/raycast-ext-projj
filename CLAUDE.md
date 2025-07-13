# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Raycast extension that appears to be related to projj (project directory management). The extension currently has a single command "clone" that copies the current date to the clipboard.

## Development Commands

- `pnpm run dev` or `ray develop` - Start development mode with hot reloading
- `pnpm run build` or `ray build` - Build the extension for production
- `pnpm run lint` or `ray lint` - Run ESLint to check code quality
- `pnpm run fix-lint` or `ray lint --fix` - Automatically fix linting issues
- `pnpm run publish` or `npx @raycast/api@latest publish` - Publish extension to Raycast Store

## Architecture & Structure

### Project Structure
- `src/` - Source code directory
  - `clone.ts` - Main command implementation (currently copies date to clipboard)
- `assets/` - Extension assets (icons, images)
- `package.json` - Raycast extension manifest and dependencies
- `tsconfig.json` - TypeScript configuration
- `eslint.config.js` - ESLint configuration using Raycast's preset

### Key Technologies
- **Raycast API** (`@raycast/api`) - Core extension framework
- **TypeScript** - Primary language with strict mode enabled
- **ESLint** - Code linting with Raycast's configuration preset
- **pnpm** - Package manager (based on presence of pnpm-lock.yaml)

### Extension Configuration
The extension is configured in `package.json` with:
- Single command "clone" in no-view mode
- ES2023 target with CommonJS modules
- Strict TypeScript configuration
- React JSX support for potential UI components

## Development Notes

- The current implementation in `clone.ts` is a placeholder that copies the current date to clipboard
- The extension uses Raycast's standard tooling (`ray` CLI) for development and building
- ESLint is configured with Raycast's official preset for consistent code style
- The project appears to be in early development stage based on the minimal implementation


## Docs

- Raycast: https://developers.raycast.com/
- Projj: https://github.com/popomore/projj