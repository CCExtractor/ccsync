# Quick Start Guide - Swagger Setup

## Commands to Run (After Installing Go)

Once you have Go installed on your system, run these commands in order:

### 1. Install Swagger CLI Tool
```bash
go install github.com/swaggo/swag/cmd/swag@latest
```

### 2. Navigate to Backend Directory
```bash
cd /Users/eshaangupta/My/csync/ccsync/backend
```

### 3. Download Dependencies
```bash
go mod download
go mod tidy
```

### 4. Generate Swagger Documentation
```bash
swag init
```

### 5. Run the Server
```bash
go run main.go
```

### 6. Access Swagger UI
Open your browser and go to:
```
http://localhost:8000/swagger/index.html
```

## What's Been Done

✅ Added Swagger annotations to all API endpoints:
  - Authentication endpoints (OAuth, callback, user info, logout)
  - Task management endpoints (get, add, edit, modify, complete, delete)

✅ Updated `main.go` with:
  - Swagger imports
  - API documentation metadata
  - Swagger UI endpoint handler

✅ Updated `go.mod` with Swagger dependencies

✅ Added comprehensive documentation in `SWAGGER_SETUP.md`

## Expected Result

After following the steps above, you should see:
- Server running on port 8000
- Swagger UI accessible at http://localhost:8000/swagger/index.html
- Interactive API documentation with all endpoints
- Ability to test APIs directly from the browser

## Need Go?

If you don't have Go installed, download it from:
https://go.dev/dl/

Choose the appropriate version for macOS (darwin).
