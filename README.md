<a href="https://github.com/its-me-abhishek/ccsync">
  <img src="https://github.com/its-me-abhishek/ccsync/blob/main/frontend/src/assets/logo.jpg" alt="CCSync">
</a>

</h1>
<h4 align="center">Web interface + Sync server for Taskwarrior 3.0 and higher</h4>
<p align="center">
    <a href="https://github.com/its-me-abhishek/ccsync/commits/main">
    <img src="https://img.shields.io/github/last-commit/its-me-abhishek/ccsync.svg?style=flat-square&logo=github&logoColor=white"
         alt="GitHub last commit"></a>
    <a href="https://github.com/its-me-abhishek/ccsync/pulls">
    <img src="https://img.shields.io/github/issues-pr-raw/its-me-abhishek/ccsync?style=flat-square&logo=github&logoColor=white"
         alt="GitHub pull requests"></a>
</p>
<p align="center">
  <a href="">Website</a> •
  <a href="">Documentation</a> •
  <a href="https://abhishek31.medium.com/">Blogs</a>
</p>

---


## Guide to setup the frontend for development purposes:

- ```bash
  npm i
  ```

- ```bash
  npm run dev
  ```

### Set environment variables in .env as:

  *For docker usage:*

  ```bash
  VITE_BACKEND_URL="http://localhost:8000/"
  VITE_FRONTEND_URL="http://localhost:80"
  VITE_CONTAINER_ORIGIN="http://localhost:8080/"
  ```

  *For normal npm usage:*

  ```bash
  VITE_BACKEND_URL="http://localhost:8000/"
  VITE_FRONTEND_URL="http://localhost:5173"
  VITE_CONTAINER_ORIGIN="http://localhost:8080/"
  ```

- Note: The ports can be changed on demand, and if you want to do so, be sure to change ports of the Dockerfiles as well as the ports in docker-compose.yml

- Run the frontend container only:
  ```bash
  docker-compose build frontend
  docker-compose up
  ```

## Guide to setup the backend for development purposes:

- Download the requirements

  ```bash
  go mod download
  go mod tidy
  ```

- Go to [Google cloud credential page](https://console.cloud.google.com/apis/credentials) for generating client id and secret.

- Add the Client ID and secret as an environment variable
- *Sample .env format:*

  ```bash
  CLIENT_ID="client_ID"
  CLIENT_SEC="client_SECRET"
  REDIRECT_URL_DEV="http://localhost:8000/auth/callback"
  SESSION_KEY=""
  # If using Docker
  FRONTEND_ORIGIN_DEV="http://localhost"
  CONTAINER_ORIGIN="http://YOUR_CONTAINER_IP_ORIGIN:8080/"
  # Else if using npm
  FRONTEND_ORIGIN_DEV="http://localhost:5173"
  CONTAINER_ORIGIN="http://localhost:8080/"
  ```

  Common pitfall: use the values

  ```
  FRONTEND_ORIGIN_DEV="http://localhost"
  CONTAINER_ORIGIN="http://172.19.0.2:8080/"
  ```

  only while using Docker Container

  use
  ```
  FRONTEND_ORIGIN_DEV="http://localhost:"
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


## Taskchampion Sync Server:

- Setup the Taskchampion Sync Server "As a Container" by following the [official documentation](https://github.com/GothenburgBitFactory/taskchampion-sync-server/tree/main)

## Google Firebase Database Setup:

- Create new project and then setup a Firestore database.
- Add a collection of the name `tasks`
- The following fields must be there in the data model of the collection:

  ```bash
  description (string)
  due (string)
  email (string)
  end (string)
  entry (string)
  id (number)
  modified (string)
  priority (string)
  project (string)
  status (string)
  tags (array : string)
  urgency (number)
  uuid (string)
  ```

- Add web support for you database and download the config file provided by Google, it would have this format:
  ```bash
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "firebase/app";
  const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
  };
  // Initialize Firebase
  export const app = initializeApp(firebaseConfig);
  ```
-  Download it, and store it at frontend/src/lib/ by the name *firestore.js*

## Run the Containers:

- This is the last step. Run these commands one at a time to setup the docker containers under a common network and run the sync server along with the backend and frontend:

```bash
  docker-compose build
  docker-compose up
```

Either the sync between TW-SyncServer works or SyncServer-BackendContainer would work if using docker, as containers interact with each other using IP, while a person outside the container cannot, and vice versa. So the config must set the origin to an address that is accessible to both client and server.
