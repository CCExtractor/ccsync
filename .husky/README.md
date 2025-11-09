# Husky Git Hooks

This directory contains Git hooks managed by Husky to ensure code quality and consistency.

## Pre-commit Hook

The pre-commit hook automatically runs before each commit to format staged files:

- **Frontend files** (`.js`, `.jsx`, `.ts`, `.tsx`, `.json`, `.css`, `.scss`, `.md`): Formatted with Prettier
- **Backend files** (`.go`): Formatted with gofmt

## Setup

Hooks are automatically installed when you run `npm install` in the root directory (via the `prepare` script).

## Manual Execution

To manually run the pre-commit checks on staged files:

```bash
npx lint-staged
```

## Bypassing Hooks

If you need to bypass the pre-commit hook (not recommended):

```bash
git commit --no-verify
```

## Requirements

- Node.js and npm (for Prettier and lint-staged)
- Go (for gofmt, only if working on backend files)
