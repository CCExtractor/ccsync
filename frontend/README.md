## Guide to setup the frontend for development purposes

- ```bash
  npm i
  ```

- ```bash
  npm run dev
  ```

- Set environment variables in .env as:

  For docker usage:

  ```bash
  VITE_BACKEND_URL="http://localhost:8000/"
  VITE_FRONTEND_URL="http://localhost:80"
  VITE_CONTAINER_ORIGIN="http://localhost:8080/"
  ```

  For normal npm usage:

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
