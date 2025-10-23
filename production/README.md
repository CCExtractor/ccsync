# To run using Docker:

1. Create a file named .backend.env with the following attributes:

```
CLIENT_ID="client_ID" # Google Auth Secret from Prerequisites
CLIENT_SEC="client_SECRET" # Google Auth Secret from Prerequisites
REDIRECT_URL_DEV="http://localhost:8000/auth/callback"
SESSION_KEY="generate a secret key using 'openssl rand -hex 32'"
FRONTEND_ORIGIN_DEV="http://localhost" # URL of the web frontend to avoid CORS errors
CONTAINER_ORIGIN="http://YOUR_CONTAINER_NAME:8080/" # Deployed taskchampion-sync-server container, default is production-syncserver-1
```

2. Run docker-compose pull to pull the CCSync images.
3. Run docker-compose up to start the project.
4. The frontend should now be available at localhost:80, the backend at localhost:8000, and the sync server at localhost:8080

# To run the project using Kubernetes:

- From WSL / Linux / Git Bash (Please run as root in order to access frontend on port 80):

```
chmod +x ./run-ports.sh
./run-ports.sh
```

- From PowerShell (Windows):

```
bash .\run-ports.sh
```

Notes:

- Ensure kubectl, tmux (for managing individual pods better) and access to your cluster are configured before running the script.
- Edit production/backend-env-configmap.yaml and create secrets as needed before running the script.
