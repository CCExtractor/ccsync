#!/bin/bash

# Starts backend, frontend, and syncserver in a tmux session with 3 panes.
# Usage: run from project root -> ./development/setup.sh


SESSION="ccsync"

# --- Safety checks ---

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
    echo "Error: tmux is not installed."
    echo "Please install it to use this script (e.g., 'brew install tmux' or 'apt-get install tmux')."
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "Error: Docker is not running."
    echo "Please start Docker to run the syncserver."
    exit 1
fi

# --- Main Script ---

# Check if the session already exists
tmux has-session -t $SESSION 2>/dev/null

if [ $? != 0 ]; then
    # Session does not exist, so let's create it.
    echo "Creating new tmux session '$SESSION'..."

    # Create a new detached session and start backend
    tmux new-session -d -s $SESSION -n "servers" "cd backend && go run ."

    # Split horizontally and run frontend
    tmux split-window -h -t $SESSION "cd frontend && npm run dev"

    # Split vertically and run syncserver
    tmux split-window -v -t $SESSION:0.1 "docker-compose up syncserver"

    # Set a 3-pane layout (T-shape)
    tmux select-layout -t $SESSION "tiled"
    
    echo "Session '$SESSION' created."
else
    echo "Session '$SESSION' already exists."
fi

# Print final info before attaching
echo "All services started inside tmux session: $SESSION"
echo "To detach: press Ctrl+b then d"

# Attach to the session
echo "Attaching to session..."
tmux attach -t $SESSION