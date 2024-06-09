# Use the official Golang image for building the backend
FROM golang:1.22-alpine as build

# Set working directory
WORKDIR /app

# Copy go.mod and go.sum files
COPY go.mod go.sum ./
RUN go mod tidy

# Copy the rest of the application code
COPY . .

# Copy the .env file
COPY .env .env

# Install dependencies for Taskwarrior and libuuid-dev
RUN apk add --no-cache cmake g++ make tar util-linux-dev rust cargo libuuid libstdc++
RUN apk update 
RUN apk add util-linux
RUN apk add libgcc
RUN apk add libstdc++
RUN apk add libgc++
RUN apk add libuuid

# Copy Taskwarrior source code and build it
COPY task-3.0.2.tar.gz /tmp/task-3.0.2.tar.gz
RUN tar xzf /tmp/task-3.0.2.tar.gz && \
    cd task-3.0.2 && \
    cmake -DCMAKE_BUILD_TYPE=release . && \
    make && \
    make install

# Build the Go application
RUN go build -o main .

# Use a minimal image for running the backend (Can use others as well)
FROM alpine:latest
WORKDIR /root/

# Copy the binary and .env file from the build stage
COPY --from=build /app/main .
COPY --from=build /app/.env .
COPY --from=build /usr/local/bin/task /usr/local/bin/task

# Expose port 8000
EXPOSE 8000

# Command to run the executable
CMD ["./main"]
