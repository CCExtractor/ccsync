# Use node image for building the frontend
FROM node:16-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install --ignore-scripts

# Copy the rest of the application code and build
COPY . .
RUN npm run build

# Serve the frontend using nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration file
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
