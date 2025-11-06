# CCSync Development Script

This directory contains a script to automate the local development setup for CCSync.

The `setup.sh` script starts all three services (backend, frontend, and sync server) in a single `tmux` session, each in its own pane.

## Prerequisites

Before running the script, you **must** have the following installed and running:

- [**Go**](https://go.dev/doc/install) (latest version)
- [**Node.js**](https://nodejs.org/en) (which includes `npm`)
- [**Docker**](https://www.docker.com/get-started) (and it must be running)
- [**Tmux**](https://github.com/tmux/tmux/wiki)

---

## 1. Environment Setup

This script **does not** create your `.env` files. You must create them first.

Copy your keys and secrets into the following two files.

#### `backend/.env`

(Place this file in the `backend/` directory)

```
CLIENT_ID="your_google_client_id"
CLIENT_SEC="your_google_client_secret"
REDIRECT_URL_DEV="http://localhost:8000/auth/callback"
SESSION_KEY="your_secret_key"
FRONTEND_ORIGIN_DEV="http://localhost:5173"
CONTAINER_ORIGIN="http://localhost:8080/"
```

#### `frontend/.env`

(Place this file in the `frontend/` directory)

```
VITE_BACKEND_URL="http://localhost:8000/"
VITE_FRONTEND_URL="http://localhost:5173"
VITE_CONTAINER_ORIGIN="http://localhost:8080/"
```

> **Note:** For help generating Google OAuth keys (`CLIENT_ID`, `CLIENT_SEC`), refer to the **main documentation** in the root directory.

---

## 2. How to Run

1.  From the **project's root directory**, make the script executable (you only need to do this once):

    ```bash
    chmod +x ./development/setup.sh
    ```

2.  Run the script from the **project's root directory**:
    ```bash
    ./development/setup.sh
    ```

This will create and attach you to a `tmux` session named `ccsync`. You will see all three servers start up, one in each pane.

> To detach from the tmux session (keep it running in the background), press **Ctrl + b**, then **d**.  
> You can reattach anytime using:
>
> ```bash
> tmux attach -t ccsync
> ```

### Troubleshooting

- **Permissions Error (Backend):** The script runs `go run .` without `sudo`. If the backend fails with a "permission denied" error, it's likely because it cannot write to your `taskrc` file. Ensure your current user has write permissions for `~/.taskrc`.
- **Docker Error:** Make sure Docker is running _before_ you execute the script.
