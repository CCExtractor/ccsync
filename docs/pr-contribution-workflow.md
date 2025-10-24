## Summary

Improve contribution workflow and templates:

- Add issue templates (bug report, feature request)
- Add PR template and security policy
- Introduce Husky + lint-staged to auto-format frontend/docs with Prettier and backend Go with gofmt
- Add cross-platform Go formatter helper script
- Add root Prettier config for docs/configs
- Update CONTRIBUTING with the new workflow

## Related issues

Closes # (link any related issue if exists)

## Changes

- [x] Backend
- [x] Frontend
- [x] Docker/Compose
- [x] Docs

## How to test

1. Ensure Node.js is installed
2. From repo root, run:
   - `npm install`
3. Make a small change to a Markdown or frontend TS/TSX file, stage, and commit — the pre-commit hook should format files.
4. For Go, change a .go file in `backend/`, stage, and commit — `gofmt` will run if available.

## Screenshots

N/A

## Checklist

- [x] Tested locally (scoped to automation and docs)
- [x] Updated docs where necessary
- [x] Linting passes (gofmt, prettier)
- [x] Added/updated tests (N/A)

### Description

Provide a brief description of the changes made in this PR

- Fixes: #(replace_with_the_issue_fixed)

### Checklist

- [x] Ran `npm run lint:staged -- --allow-empty` (format check)
- [x] Ran `gofmt -w .` (for Go backend) or let hooks format on commit
- [x] Ran `npm test` where applicable
- [x] Added unit tests, if applicable
- [x] Verified all tests pass
- [x] Updated documentation, if needed

### Additional Notes

Any additional info, screenshots, or context
