#!/bin/bash

SESSION="ccsync"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "CCSync Development Setup"
echo "========================"
echo ""

if ! command -v tmux &> /dev/null; then
    echo "Error: tmux is not installed."
    echo "Install it using:"
    echo "  - macOS: brew install tmux"
    echo "  - Ubuntu/Debian: sudo apt-get install tmux"
    echo "  - Fedora: sudo dnf install tmux"
    exit 1
fi

if ! command -v go &> /dev/null; then
    echo "Error: Go is not installed."
    echo "Download from: https://go.dev/doc/install"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed."
    echo "Download from: https://nodejs.org/"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed."
    echo "It should come with Node.js: https://nodejs.org/"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "Error: Docker is not running."
    echo "Please start Docker Desktop or the Docker daemon."
    exit 1
fi

if [ ! -f "$ROOT_DIR/backend/.env" ]; then
    echo "Error: backend/.env file not found."
    echo "Please create it with required environment variables."
    echo "See development/README.md or https://its-me-abhishek.github.io/ccsync-docs/ for details."
    exit 1
fi

# if [ ! -f "$ROOT_DIR/frontend/.env" ]; then
#     echo "Error: frontend/.env file not found."
#     echo "Please create it with required environment variables."
#     echo "See development/README.md or https://its-me-abhishek.github.io/ccsync-docs/ for details."
#     exit 1
# fi

echo "Installing dependencies..."
echo ""

cd "$ROOT_DIR/backend"
if [ ! -d "vendor" ] && [ ! -f "go.sum" ]; then
    echo "Downloading Go modules..."
    go mod download
    go mod tidy
fi

cd "$ROOT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    echo "Installing npm packages..."
    npm install
fi

echo ""
echo "Starting services in tmux session '$SESSION'..."
echo ""

tmux has-session -t $SESSION 2>/dev/null

if [ $? == 0 ]; then
    echo "Session '$SESSION' already exists."
    echo "Attaching to existing session..."
    tmux attach -t $SESSION
    exit 0
fi

tmux new-session -d -s $SESSION -n "ccsync"

tmux send-keys -t $SESSION:0 "cd $ROOT_DIR/backend && echo 'Starting Backend...' && go run ." C-m

tmux split-window -h -t $SESSION:0
tmux send-keys -t $SESSION:0.1 "cd $ROOT_DIR/frontend && echo 'Starting Frontend...' && npm run dev" C-m

tmux split-window -v -t $SESSION:0.1
tmux send-keys -t $SESSION:0.2 "cd $ROOT_DIR && echo 'Starting Sync Server...' && docker-compose up syncserver" C-m

tmux select-layout -t $SESSION:0 main-vertical

echo "Services started successfully!"
echo ""
echo "Tmux commands:"
echo "  - Detach: Ctrl+b then d"
echo "  - Reattach: tmux attach -t $SESSION"
echo "  - Kill session: tmux kill-session -t $SESSION"
echo ""
echo "Attaching to session..."
sleep 1

tmux attach -t $SESSION
