#!/bin/bash

echo "Setting up Git hooks for CCSync..."
echo ""

HOOKS_DIR=".git/hooks"
PRE_COMMIT_HOOK="$HOOKS_DIR/pre-commit"

if [ ! -d "$HOOKS_DIR" ]; then
    echo "Error: .git/hooks directory not found."
    echo "Make sure you're running this from the repository root."
    exit 1
fi

# Remove Husky hooks path if it exists (from previous Husky setup)
git config --unset core.hookspath 2>/dev/null || true

cat > "$PRE_COMMIT_HOOK" << 'EOF'
#!/bin/bash

echo "Running pre-commit checks..."

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$STAGED_FILES" ]; then
    exit 0
fi

FRONTEND_FILES=$(echo "$STAGED_FILES" | grep -E '^frontend/.*\.(js|jsx|ts|tsx|json|css|scss|md)$' || true)
BACKEND_FILES=$(echo "$STAGED_FILES" | grep -E '^backend/.*\.go$' || true)

if [ -n "$FRONTEND_FILES" ]; then
    echo "Formatting frontend files with Prettier..."
    cd frontend
    echo "$FRONTEND_FILES" | sed 's|^frontend/||' | xargs npx prettier --write --ignore-unknown
    if [ $? -ne 0 ]; then
        echo "Error: Prettier formatting failed"
        exit 1
    fi
    cd ..
    echo "$FRONTEND_FILES" | xargs git add
fi

if [ -n "$BACKEND_FILES" ]; then
    if command -v gofmt &> /dev/null; then
        echo "Formatting backend Go files with gofmt..."
        echo "$BACKEND_FILES" | xargs gofmt -w
        if [ $? -ne 0 ]; then
            echo "Error: gofmt formatting failed"
            exit 1
        fi
        echo "$BACKEND_FILES" | xargs git add
    else
        echo "Warning: gofmt not found. Skipping Go file formatting."
        echo "Install Go to enable automatic Go formatting."
    fi
fi

echo "Pre-commit checks completed successfully!"
exit 0
EOF

chmod +x "$PRE_COMMIT_HOOK"

echo "✓ Pre-commit hook installed successfully!"
echo ""
echo "The hook will automatically:"
echo "  - Format frontend files with Prettier"
echo "  - Format backend Go files with gofmt (if Go is installed)"
echo ""
echo "To bypass the hook (not recommended), use: git commit --no-verify"
