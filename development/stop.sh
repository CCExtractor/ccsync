#!/bin/bash

SESSION="ccsync"

echo "Stopping CCSync development environment..."
echo ""

tmux has-session -t $SESSION 2>/dev/null

if [ $? != 0 ]; then
    echo "Session '$SESSION' does not exist or is not running."
    exit 0
fi

echo "Killing tmux session '$SESSION'..."
tmux kill-session -t $SESSION

echo "Stopping Docker containers..."
docker-compose down

echo ""
echo "CCSync development environment stopped successfully."
