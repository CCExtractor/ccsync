package main

import (
	"encoding/gob"
	"net/http"
	"os"
	"time"

	"ccsync_backend/utils"

	"github.com/gorilla/sessions"
	"github.com/joho/godotenv"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"

	"ccsync_backend/controllers"
	"ccsync_backend/middleware"

	_ "ccsync_backend/docs" // Swagger docs
	httpSwagger "github.com/swaggo/http-swagger"
)

// @title CCSync API
// @version 1.0
// @description API for CCSync - Web Interface + Sync Server for Taskwarrior 3.0 and Higher
// @description A self-hosted solution for syncing and managing your tasks anywhere, anytime.

// @contact.name API Support
// @contact.url https://github.com/CCExtractor/ccsync

// @license.name MIT
// @license.url https://github.com/CCExtractor/ccsync/blob/main/LICENSE

// @host localhost:8000
// @BasePath /

// @securityDefinitions.apikey ApiKeyAuth
// @in header
// @name Authorization

// @tag.name Tasks
// @tag.description Task management operations

// @tag.name Auth
// @tag.description Authentication and authorization endpoints

func main() {
	if os.Getenv("ENV") != "production" {
		_ = godotenv.Load()
		utils.Logger.Info("Loaded")
	} else {
		utils.Logger.Info("Continue")
	}

	controllers.GlobalJobQueue = controllers.NewJobQueue()
	// OAuth2 client credentials
	clientID := os.Getenv("CLIENT_ID")
	clientSecret := os.Getenv("CLIENT_SEC")
	redirectURL := os.Getenv("REDIRECT_URL_DEV")

	// Get port from environment or default to 8000
	port := os.Getenv("CCSYNC_PORT")
	if port == "" {
		port = "8000"
	}

	// OAuth2 configuration
	conf := &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURL:  redirectURL,
		Scopes:       []string{"email", "profile"},
		Endpoint:     google.Endpoint,
	}

	// Create a session store
	sessionKey := []byte(os.Getenv("SESSION_KEY"))
	if len(sessionKey) == 0 {
		utils.Logger.Fatal("SESSION_KEY environment variable is not set or empty")
	}
	store := sessions.NewCookieStore(sessionKey)
	gob.Register(map[string]interface{}{})

	app := controllers.App{Config: conf, SessionStore: store}
	mux := http.NewServeMux()

	//Rate limiter middleware that allows 50 requests per 30 seconds per IP
	limiter := middleware.NewRateLimiter(30*time.Second, 50)
	rateLimitedHandler := middleware.RateLimitMiddleware(limiter)

	mux.Handle("/auth/oauth", rateLimitedHandler(http.HandlerFunc(app.OAuthHandler)))
	mux.Handle("/auth/callback", rateLimitedHandler(http.HandlerFunc(app.OAuthCallbackHandler)))
	mux.Handle("/api/user", rateLimitedHandler(http.HandlerFunc(app.UserInfoHandler)))
	mux.Handle("/auth/logout", rateLimitedHandler(http.HandlerFunc(app.LogoutHandler)))
	mux.Handle("/tasks", rateLimitedHandler(http.HandlerFunc(controllers.TasksHandler)))
	mux.Handle("/add-task", rateLimitedHandler(http.HandlerFunc(controllers.AddTaskHandler)))
	mux.Handle("/edit-task", rateLimitedHandler(http.HandlerFunc(controllers.EditTaskHandler)))
	mux.Handle("/modify-task", rateLimitedHandler(http.HandlerFunc(controllers.ModifyTaskHandler)))
	mux.Handle("/complete-task", rateLimitedHandler(http.HandlerFunc(controllers.CompleteTaskHandler)))
	mux.Handle("/delete-task", rateLimitedHandler(http.HandlerFunc(controllers.DeleteTaskHandler)))
	mux.Handle("/sync/logs", rateLimitedHandler(http.HandlerFunc(controllers.SyncLogsHandler)))

	mux.HandleFunc("/ws", controllers.WebSocketHandler)

	// API documentation endpoint
	mux.HandleFunc("/api/docs/", httpSwagger.WrapHandler)

	go controllers.JobStatusManager()
	utils.Logger.Infof("Server started at :%s", port)
	utils.Logger.Infof("API documentation available at http://localhost:%s/api/docs/index.html", port)
	if err := http.ListenAndServe(":"+port, app.EnableCORS(mux)); err != nil {
		utils.Logger.Fatal(err)
	}
}
