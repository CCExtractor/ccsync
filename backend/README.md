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
  FRONTEND_ORIGIN_DEV="http://localhost"
  REDIRECT_URL_DEV="http://localhost:8000/auth/callback"
  SESSION_KEY=""
  ```

  Common pitfall: use the value

  ```
  FRONTEND_ORIGIN_DEV="http://localhost"
  CONTAINER_ORIGIN="http://172.19.0.2:8080/"
  ```

  only while using Docker Container

  use
  ```
  FRONTEND_ORIGIN_DEV="http://localhost"
  CONTAINER_ORIGIN="http://localhost:8080/"
  ```
  if you want to run by `npm run dev`

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
