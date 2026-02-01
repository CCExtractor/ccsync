# CCSync Production Deployment

This directory contains the production deployment configuration for CCSync.

## Overview

The deployment system uses:
- **GitHub Actions** to build and push Docker images to GHCR
- **Automatic deployment** to production on every push to `main`
- **Automatic rollback** if health checks fail

## VPS Directory Structure

```
/opt/ccsync/
├── docker-compose.yml      # Copy from this directory
├── .env                    # Contains IMAGE_TAG=<sha>
├── secrets/
│   └── backend.env         # OAuth secrets, session key (chmod 600)
├── data/
│   ├── backend/            # Backend persistent data
│   └── syncserver/         # Taskchampion sync server data
├── scripts/
│   └── deploy.sh           # Copy from this directory
└── deployments/            # Deployment history
    └── current -> ...      # Symlink to current deployment
```

## Initial VPS Setup

### 1. Create deploy user

```bash
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG docker deploy
```

### 2. Create directory structure

```bash
sudo mkdir -p /opt/ccsync/{scripts,secrets,data/backend,data/syncserver,deployments}
sudo chown -R deploy:deploy /opt/ccsync
sudo chmod 750 /opt/ccsync
sudo chmod 700 /opt/ccsync/secrets
```

### 3. Copy deployment files

```bash
# Copy docker-compose.yml
sudo -u deploy cp deployment/docker-compose.yml /opt/ccsync/

# Copy and make deploy script executable
sudo -u deploy cp deployment/deploy.sh /opt/ccsync/scripts/
sudo chmod +x /opt/ccsync/scripts/deploy.sh
```

### 4. Create secrets file

```bash
sudo -u deploy nano /opt/ccsync/secrets/backend.env
sudo chmod 600 /opt/ccsync/secrets/backend.env
```

Required variables in `backend.env`:
```bash
# Google OAuth (from Google Cloud Console)
CLIENT_ID=your-client-id.apps.googleusercontent.com
CLIENT_SEC=your-client-secret

# Session security (generate with: openssl rand -hex 32)
SESSION_KEY=your-64-character-hex-string

# Environment
ENV=production
PORT=8000

# URLs
ALLOWED_ORIGIN=https://taskwarrior-server.ccextractor.org
FRONTEND_ORIGIN_DEV=https://taskwarrior-server.ccextractor.org
REDIRECT_URL_DEV=https://taskwarrior-server.ccextractor.org/auth/callback
CONTAINER_ORIGIN=https://taskwarrior-server.ccextractor.org:8080
```

### 5. Generate SSH key for GitHub Actions

```bash
# As deploy user
sudo -u deploy ssh-keygen -t ed25519 -C "github-deploy@ccsync" -f /home/deploy/.ssh/github_deploy -N ""

# Add to authorized_keys
sudo -u deploy bash -c 'cat /home/deploy/.ssh/github_deploy.pub >> /home/deploy/.ssh/authorized_keys'
sudo -u deploy chmod 600 /home/deploy/.ssh/authorized_keys

# Display private key (add to GitHub Secrets as DEPLOY_SSH_KEY)
sudo cat /home/deploy/.ssh/github_deploy
```

## GitHub Repository Setup

### 1. Create "production" environment

In GitHub repo settings → Environments → Create "production":
- Add required reviewers (optional, for manual approval)
- Add deployment branch rule: `main`

### 2. Add environment variables

| Name | Value |
|------|-------|
| `SSH_HOST` | `<your-server-ip>` |
| `SSH_USER` | `deploy` |
| `SSH_PORT` | `22` |

### 3. Add environment secrets

| Name | Description |
|------|-------------|
| `DEPLOY_SSH_KEY` | Private key from step 5 above |

## Deployment

### Automatic (on every push to main)

1. Push/merge to `main` branch
2. GitHub Actions builds frontend and backend images in parallel
3. Images are pushed to GHCR with commit SHA tag
4. Deploy job SSHs to VPS and runs `deploy.sh` with the commit SHA
5. Health check verifies deployment succeeded
6. Automatic rollback if health check fails

### Manual deployment (for rollbacks or hotfixes)

```bash
# SSH to VPS
ssh deploy@<your-server-ip>

# Deploy specific tag
/opt/ccsync/scripts/deploy.sh abc1234

# Deploy latest
/opt/ccsync/scripts/deploy.sh latest
```

## Rollback

### Automatic

The deploy script automatically rolls back if:
- Docker image pull fails
- Container startup fails
- Health check fails within 120 seconds

### Manual

```bash
# Check deployment history
ls -la /opt/ccsync/deployments/

# Get previous tag from a deployment record
cat /opt/ccsync/deployments/<deployment-dir>/info.txt

# Roll back to previous tag
/opt/ccsync/scripts/deploy.sh <previous-tag>
```

## Monitoring

The health check script at `/opt/ccsync-monitor/health-check.sh` monitors:
- Docker container health status
- Backend `/health` endpoint
- Alerts to Zulip on failures
