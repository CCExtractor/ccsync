# CCSync Development Setup

This directory contains scripts to automate local development setup for CCSync.

The `setup.sh` script starts all three services (backend, frontend, and sync server) in a single tmux session with separate panes for each service.

> **Note:** The backend should ideally be run in a separate user environment (preferably root user) to avoid permission issues with Taskwarrior configuration files.


> **Git Hooks:** Pre-commit hooks are automatically configured when you run `npm install` in the frontend directory. These hooks will format your code before each commit.

## Prerequisites

Before running the setup script, ensure you have the following installed:

- **Go** (1.19 or higher) - [Installation Guide](https://go.dev/doc/install)
- **Node.js** (16 or higher) and **npm** - [Installation Guide](https://nodejs.org/)
- **Docker** and **Docker Compose** - [Installation Guide](https://docs.docker.com/get-docker/)
- **tmux** - Terminal multiplexer
  - macOS: `brew install tmux`
  - Ubuntu/Debian: `sudo apt-get install tmux`
  - Fedora: `sudo dnf install tmux`

## Environment Configuration

The setup script requires environment files for both backend and frontend. Create these files before running the script.

### Backend Environment (`./backend/.env`)

Create a file at `./backend/.env` (relative to project root) with the following content:

```bash
CLIENT_ID="your_google_client_id"
CLIENT_SEC="your_google_client_secret"
REDIRECT_URL_DEV="http://localhost:8000/auth/callback"
SESSION_KEY="your_random_session_key"
FRONTEND_ORIGIN_DEV="http://localhost:5173"
CONTAINER_ORIGIN="http://localhost:8080/"
```

**How to get Google OAuth credentials:**

For detailed instructions, refer to the [CCSync Documentation](https://its-me-abhishek.github.io/ccsync-docs/).

Quick steps:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth 2.0 Client ID"
5. Configure the OAuth consent screen if prompted
6. Select "Web application" as the application type
7. Add authorized redirect URI: `http://localhost:8000/auth/callback`
8. Copy the Client ID and Client Secret

**Generate SESSION_KEY:**

You can generate a random session key using:

```bash
openssl rand -base64 32
```

### Frontend Environment (`frontend/.env`)

Create a file at `frontend/.env` with the following content:

```bash
VITE_BACKEND_URL="http://localhost:8000/"
VITE_FRONTEND_URL="http://localhost:5173"
VITE_CONTAINER_ORIGIN="http://localhost:8080/"
```

## Usage

### Starting the Development Environment

From the project root directory:

1. Make the script executable (first time only):

```bash
chmod +x development/setup.sh
```

2. Run the setup script:

```bash
./development/setup.sh
```

The script will:

- Verify all prerequisites are installed
- Check that environment files exist
- Install dependencies if needed (Go modules and npm packages)
- Start all three services in a tmux session
- Automatically attach you to the session

### Accessing the Services

Once running, you can access:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/api/docs/index.html
- **Sync Server**: http://localhost:8080 (started via `docker-compose up syncserver`)

### Tmux Commands

- **Detach from session** (keep services running): Press `Ctrl+b`, then `d`
- **Reattach to session**: `tmux attach -t ccsync`
- **Navigate between panes**: `Ctrl+b` then arrow keys
- **Scroll in a pane**: `Ctrl+b` then `[`, use arrow keys, press `q` to exit

### Stopping the Development Environment

To stop all services and clean up:

1. Make the stop script executable (first time only):

```bash
chmod +x development/stop.sh
```

2. Run the stop script:

```bash
./development/stop.sh
```

This will kill the tmux session and stop all Docker containers.

## Troubleshooting

### Port Already in Use

If you see errors about ports already being in use:

```bash
# Check what's using the ports
lsof -i :8000  # Backend
lsof -i :5173  # Frontend
lsof -i :8080  # Sync Server

# Kill the process using the port
kill -9 <PID>
```

### Docker Not Running

Ensure Docker Desktop is running or start the Docker daemon:

```bash
# macOS/Linux
sudo systemctl start docker

# Or start Docker Desktop application
```

### Permission Denied Errors

If you encounter permission errors with Taskwarrior:

```bash
# Ensure your user has write permissions
chmod 644 ~/.taskrc
```

### Dependencies Not Installing

If Go modules or npm packages fail to install:

```bash
# Backend
cd backend
go mod download
go mod tidy

# Frontend
cd frontend
npm install
```

### Session Already Exists

If the tmux session already exists, the script will attach to it. To start fresh:

```bash
# Kill the existing session
tmux kill-session -t ccsync

# Run setup again
./development/setup.sh
```

## Additional Resources

- [CCSync Documentation](https://its-me-abhishek.github.io/ccsync-docs/)
- [Taskwarrior Documentation](https://taskwarrior.org/docs/)
- [Tmux Cheat Sheet](https://tmuxcheatsheet.com/)
- [Contributing Guidelines](../CONTRIBUTING.md)

## Notes

- The setup script automatically installs dependencies if they're not present
- All services run in development mode with hot-reloading enabled
- Logs from all services are visible in their respective tmux panes
- The script validates environment files before starting services
