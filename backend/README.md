## Guide to setup the backend for development purposes:

- Download the requirements

  ```bash
  go mod download
  go mod tidy
  ```

- Go to [Google cloud credential page](https://console.cloud.google.com/apis/credentials) for generating client id and secret.

- Add the Client ID and secret as an environment variable
  
  Sample .env format:
  CLIENT_ID=""
  CLIENT_SEC=""
  FRONTEND_ORIGIN_DEV=""
  REDIRECT_URL_DEV=""
  SESSION_KEY=""

- Run the application:
  
  ```bash
  go mod download
  go mod tidy
  ```
