## Guide to setup the backend for development purposes:

- Download the requirements

  ```bash
  go mod download
  go mod tidy
  ```

- Go to [Google cloud credential page](https://console.cloud.google.com/apis/credentials) for generating client id and secret.

- Add the Client ID and secret as an environment variable
- Sample .env format:

  ```bash
  CLIENT_ID="client_ID"
  CLIENT_SEC="client_SECRET"
  REDIRECT_URL_DEV="http://localhost:8000/auth/callback"
  SESSION_KEY=""
  # If using Docker
  FRONTEND_ORIGIN_DEV="http://localhost"
  CONTAINER_ORIGIN="http://YOUR_CONTAINER_NAME:8080/"
  # Else if using npm
  FRONTEND_ORIGIN_DEV="http://localhost:5173"
  CONTAINER_ORIGIN="http://localhost:8080/"
  
  # Job Queue Configuration (Optional)
  CLEANUP_CRON_SCHEDULE="0 0 * * *"    
  CLEANUP_RETENTION_DAYS="7"           
  QUEUE_DB_PATH="/app/data/queue.db" 
  ```

  Common pitfall: use the value

  ```
  FRONTEND_ORIGIN_DEV="http://localhost"
  CONTAINER_ORIGIN="http://YOUR_CONTAINER_NAME:8080/"
  ```

  only while using Docker Container

  use

  ```
  FRONTEND_ORIGIN_DEV="http://localhost:5173"
  CONTAINER_ORIGIN="http://localhost:8080/"
  ```

  if you want to run by `npm run dev`

  ### Optional: Custom Backend Port

  You can set a custom port for the backend server using the `CCSYNC_PORT` environment variable:

  ```bash
  CCSYNC_PORT="8081"
  ```

  Note:

  `CCSYNC_PORT` only affects the port of the backend process itself, not the Docker port mapping, and is mainly intended for use outside of a containerized environment to avoid port conflicts.
  If you are running the backend via Docker, the exposed ports are determined by the compose configuration. To use a different port in a Docker environment, you must manually update the docker-compose.yml file to adjust the container’s port mapping.
  Also, if you change `CCSYNC_PORT`, remember to update `CONTAINER_ORIGIN` accordingly.

  ### Rate Limiting and Trusted Proxies

  The backend includes rate limiting that uses the client's IP address. When running behind a reverse proxy (like nginx), you need to configure trusted proxies so the backend correctly identifies client IPs from proxy headers.

  **Automatic Trust:**
  - Loopback addresses (127.0.0.1, ::1) are always trusted
  - In production (`ENV=production`), Docker bridge networks (172.16.0.0/12) are trusted

  **Manual Configuration:**

  Use `TRUSTED_PROXIES` to specify additional trusted proxy IPs or CIDR ranges:

  ```bash
  # Single IP
  TRUSTED_PROXIES="10.0.0.1"

  # Multiple IPs (comma-separated)
  TRUSTED_PROXIES="10.0.0.1,10.0.0.2"

  # CIDR notation
  TRUSTED_PROXIES="10.0.0.0/8,192.168.0.0/16"
  ```

  **When to use:**
  - **Local development**: Not needed (loopback is trusted by default)
  - **Production with nginx on same server**: Not needed (loopback is trusted)
  - **Production with external load balancer**: Set to your load balancer's IP/range

## Persistent Job Queue

The backend includes a persistent job queue system that ensures task operations survive server restarts and provides automatic cleanup of old job logs.

### Features

- **Persistence**: Jobs are stored in a bbolt database and survive backend restarts
- **Automatic Cleanup**: Old completed and failed job logs are automatically cleaned up
- **Configurable**: Cleanup schedule and retention period can be customized

### Configuration

The job queue system uses the following environment variables:

- `CLEANUP_CRON_SCHEDULE`: Cron schedule for cleanup job (default: "0 0 * * *" - daily at midnight)
- `CLEANUP_RETENTION_DAYS`: Number of days to keep job logs (default: 7)
- `QUEUE_DB_PATH`: Path to the queue database file (default: "/app/data/queue.db")

### Database Location

The queue database is stored at `/app/data/queue.db` inside the container, which is mounted to `./backend/data/queue.db` on the host system via Docker volume.

- Run the application:

  ```bash
  go mod download
  go mod tidy
  ```

- Run the backend container only:
  ```bash
  docker-compose build backend
  docker-compose up
  ```

## API Documentation

Once the backend server is running, you can view the interactive API documentation (Swagger UI) at:

- **Local development**: http://localhost:8000/api/docs/index.html

The documentation provides detailed information about all available endpoints, request/response schemas, and allows you to test the API directly from your browser.
