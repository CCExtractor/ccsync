# Production Deployment

## Option 1: Docker (HTTP only, for local/development)

1. Create a file named `.backend.env` with the following attributes:

```bash
CLIENT_ID="client_ID" # Google Auth Secret from Prerequisites
CLIENT_SEC="client_SECRET" # Google Auth Secret from Prerequisites
REDIRECT_URL_DEV="http://localhost:8000/auth/callback"
SESSION_KEY="generate a secret key using 'openssl rand -hex 32'"
FRONTEND_ORIGIN_DEV="http://localhost" # URL of the web frontend to avoid CORS errors
CONTAINER_ORIGIN="http://YOUR_CONTAINER_NAME:8080/" # Deployed taskchampion-sync-server container, default is production-syncserver-1

# Job Queue Configuration (optional, defaults shown)
CLEANUP_CRON_SCHEDULE="0 0 * * *" # Daily at midnight
CLEANUP_RETENTION_DAYS="7" # Keep logs for 7 days
QUEUE_DB_PATH="/app/data/queue.db" # Queue database location, mounted via Docker volume
```

2. Run `docker-compose pull` to pull the CCSync images.
3. Run `docker-compose up` to start the project.
4. The frontend should now be available at localhost:80, the backend at localhost:8000, and the sync server at localhost:8080

## Option 2: Docker with nginx Reverse Proxy (HTTPS, recommended for production)

For production deployments with HTTPS, use nginx as a reverse proxy with Let's Encrypt SSL certificates.

### Prerequisites

- A domain name pointing to your server
- Ubuntu/Debian server with root access

### Step 1: Install nginx and certbot

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

### Step 2: Obtain SSL certificate

```bash
sudo systemctl stop nginx
sudo certbot certonly --standalone -d your-domain.com
sudo systemctl start nginx
```

### Step 3: Configure nginx

1. Copy `example.nginx.conf` to nginx sites:
   ```bash
   sudo cp example.nginx.conf /etc/nginx/sites-available/ccsync
   ```

2. Edit the file and replace `your-domain.com` with your actual domain:
   ```bash
   sudo sed -i 's/your-domain.com/your-actual-domain.com/g' /etc/nginx/sites-available/ccsync
   ```

3. Enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/ccsync /etc/nginx/sites-enabled/
   sudo rm -f /etc/nginx/sites-enabled/default
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### Step 4: Use production Docker Compose override

The `production/docker-compose.production.yml` file binds all ports to localhost only, so nginx handles external traffic. Use it as an override file (do not modify the base `docker-compose.yml`):

```bash
# From the project root directory:
docker compose -f docker-compose.yml -f production/docker-compose.production.yml up -d
```

This applies the following port changes:
| Service | Development | Production |
|---------|-------------|------------|
| frontend | `80:80` | `127.0.0.1:3000:80` |
| backend | `8000:8000` | `127.0.0.1:8000:8000` |
| syncserver | `8080:8080` | `127.0.0.1:8081:8080` |

### Step 5: Create environment files

Create `.backend.env`:
```bash
CLIENT_ID="your-google-client-id"
CLIENT_SEC="your-google-client-secret"
REDIRECT_URL_DEV="https://your-domain.com/auth/callback"
SESSION_KEY="$(openssl rand -hex 32)"
FRONTEND_ORIGIN_DEV="https://your-domain.com"
CONTAINER_ORIGIN="http://syncserver:8080/"
ENV="production"

# Rate limiting: Trusted proxies for correct client IP detection
# Not needed if nginx runs on the same server (loopback is trusted by default)
# Only set this if using an external load balancer:
# TRUSTED_PROXIES="10.0.0.0/8,192.168.0.0/16"
```

Create `.frontend.env` (see `example.frontend.env`):
```bash
VITE_BACKEND_URL="https://your-domain.com/"
VITE_FRONTEND_URL="https://your-domain.com"
VITE_CONTAINER_ORIGIN="https://your-domain.com:8080/"
```

### Step 6: Configure Google OAuth

In Google Cloud Console, add the redirect URI:
- `https://your-domain.com/auth/callback`

### Step 7: Deploy

```bash
# Pull latest images
docker compose pull

# Start with production override (localhost-only ports)
docker compose -f docker-compose.yml -f production/docker-compose.production.yml up -d
```

Your CCSync instance should now be available at `https://your-domain.com`

**Useful commands:**
```bash
# View logs
docker compose -f docker-compose.yml -f production/docker-compose.production.yml logs -f

# Restart services
docker compose -f docker-compose.yml -f production/docker-compose.production.yml restart

# Rebuild and restart (after code changes)
docker compose -f docker-compose.yml -f production/docker-compose.production.yml up -d --build
```

---

## Option 3: Kubernetes

From WSL / Linux / Git Bash (run as root to access frontend on port 80):

```bash
chmod +x ./run-ports.sh
./run-ports.sh
```

From PowerShell (Windows):

```bash
bash .\run-ports.sh
```

Notes:

- Ensure kubectl, tmux (for managing individual pods better) and access to your cluster are configured before running the script.
- Edit `backend-env-configmap.yaml` and create secrets as needed before running the script.
