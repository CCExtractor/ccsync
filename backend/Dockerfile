# Use the official Golang image for building the backend
FROM golang:1.23.1-alpine AS build

# Set working directory
WORKDIR /app

# Copy go.mod and go.sum files
COPY go.mod go.sum ./
RUN go mod tidy

# Copy the rest of the application code
COPY . .

# Copy the .env file
# COPY .env .env

# Install dependencies for Taskwarrior and libuuid
RUN apk add --no-cache \
    cmake \
    g++ \
    make \
    tar \
    util-linux-dev \
    rust \
    cargo \
    libuuid \
    libstdc++ \
    libgcc \
    # Ensure all required packages are installed
    && apk update \
    && apk add --no-cache \
    libuuid \
    libstdc++ \
    libgcc \
    util-linux

# Download and build Taskwarrior
RUN wget https://github.com/GothenburgBitFactory/taskwarrior/releases/download/v3.1.0/task-3.1.0.tar.gz -O /tmp/task-3.1.0.tar.gz && \
    tar xzf /tmp/task-3.1.0.tar.gz -C /tmp && \
    cd /tmp/task-3.1.0 && \
    cmake -B build -DCMAKE_BUILD_TYPE=None . && \
    cmake --build build && \
    cmake --install build

# Build the Go application
RUN go build -o main .

# Use a minimal image for running the backend
FROM alpine:3.20
WORKDIR /root/

# Install runtime dependencies
RUN apk add --no-cache \
    libuuid \
    libstdc++ \
    libgcc \
    gnutls

# Copy the binary and .env file from the build stage
COPY --from=build /app/main .
# COPY --from=build /app/.env .
COPY --from=build /usr/local/bin/task /usr/local/bin/task

# Expose port 8000
EXPOSE 8000

# Command to run the executable
CMD ["./main"]
