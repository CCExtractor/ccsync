# Swagger API Documentation Setup

This guide explains how to set up and use Swagger API documentation for the CCSync backend.

## Prerequisites

- Go 1.19 or higher installed
- The CCSync backend project cloned locally

## Installation Steps

### 1. Install Swagger CLI Tool

Install the `swag` command-line tool globally:

```bash
go install github.com/swaggo/swag/cmd/swag@latest
```

Make sure your `$GOPATH/bin` is in your system's `PATH` environment variable.

### 2. Install Dependencies

Navigate to the backend directory and install the project dependencies:

```bash
cd backend
go mod download
go mod tidy
```

This will download all required packages including:
- `github.com/swaggo/swag` - Swagger annotation parser
- `github.com/swaggo/http-swagger` - Swagger UI handler for net/http

### 3. Generate Swagger Documentation

Run the following command from the backend directory to generate Swagger documentation:

```bash
swag init
```

This command will:
- Parse all Swagger annotations in your Go files
- Generate a `docs` folder containing:
  - `docs.go` - Generated Go code
  - `swagger.json` - Swagger specification in JSON format
  - `swagger.yaml` - Swagger specification in YAML format

**Note:** You need to run `swag init` every time you make changes to the API annotations.

### 4. Run the Server

Start the backend server:

```bash
go run main.go
```

The server will start on port 8000, and you'll see:
```
Server started at :8000
Swagger documentation available at http://localhost:8000/swagger/index.html
```

### 5. Access Swagger UI

Open your browser and navigate to:

```
http://localhost:8000/swagger/index.html
```

You should see the interactive Swagger UI with all your API endpoints documented.

## API Endpoints Documentation

The following endpoints are documented:

### Authentication Endpoints (Tag: Auth)
- `GET /auth/oauth` - Initiate OAuth login
- `GET /auth/callback` - OAuth callback handler
- `GET /api/user` - Get user information
- `GET /auth/logout` - Logout user

### Task Management Endpoints (Tag: Tasks)
- `GET /tasks` - Get all tasks for a user
- `POST /add-task` - Add a new task
- `POST /edit-task` - Edit task description and tags
- `POST /modify-task` - Modify task properties
- `POST /complete-task` - Mark a task as completed
- `POST /delete-task` - Delete a task

## Using Swagger UI

### Testing Endpoints

1. Click on any endpoint to expand it
2. Click "Try it out" button
3. Fill in the required parameters
4. Click "Execute" to make the request
5. View the response below

### Request Parameters

For **GET /tasks** endpoint, you need to provide:
- `email` - User email address
- `encryptionSecret` - User encryption secret
- `UUID` - User UUID

For **POST** endpoints, you need to provide a JSON body. Click on the "Schema" tab to see the required structure.

## Updating Documentation

When you add new endpoints or modify existing ones:

1. Add/update Swagger annotations in your handler functions
2. Run `swag init` from the backend directory
3. Restart the server
4. Refresh the Swagger UI page

## Swagger Annotation Format

Here's an example of how annotations are structured:

```go
// HandlerName godoc
// @Summary Short description
// @Description Detailed description
// @Tags TagName
// @Accept json
// @Produce json
// @Param paramName query/body/path type true/false "Description"
// @Success 200 {object} ModelName "Success message"
// @Failure 400 {string} string "Error message"
// @Router /endpoint [get/post/put/delete]
func HandlerName(w http.ResponseWriter, r *http.Request) {
    // handler implementation
}
```

## Configuration

The main Swagger configuration is in `main.go`:

```go
// @title CCSync API
// @version 1.0
// @description API for CCSync - Web Interface + Sync Server for Taskwarrior 3.0
// @host localhost:8000
// @BasePath /
```

You can modify these values to update:
- API title
- Version
- Description
- Host (change for production)
- Base path

## Production Deployment

For production deployment:

1. Update the `@host` annotation in `main.go` to your production domain
2. Run `swag init` to regenerate documentation
3. Build and deploy your application
4. Access Swagger UI at `https://your-domain.com/swagger/index.html`

## Troubleshooting

### `swag: command not found`

Make sure `$GOPATH/bin` is in your PATH:

```bash
export PATH=$PATH:$(go env GOPATH)/bin
```

Add this to your `.bashrc`, `.zshrc`, or equivalent shell configuration file.

### Documentation not updating

1. Delete the `docs` folder
2. Run `swag init` again
3. Restart the server

### Import cycle error

If you see "import cycle not allowed", make sure the `docs` package import in `main.go` is:
```go
_ "ccsync_backend/docs"
```

The underscore `_` is important as it's a blank import.

## Additional Resources

- [Swaggo Documentation](https://github.com/swaggo/swag)
- [Swagger Specification](https://swagger.io/specification/)
- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)

## Replacing Postman Collection

With Swagger documentation in place, you can:

1. Export the Swagger JSON specification from `http://localhost:8000/swagger/doc.json`
2. Import it into Postman (File → Import → Paste the URL or upload the file)
3. Use Swagger UI directly for API testing instead of maintaining a separate Postman collection

The Swagger documentation will automatically update as you modify your code, eliminating the need to manually maintain API documentation.
