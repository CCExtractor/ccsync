package main

import (
	"encoding/gob"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/sessions"
	"github.com/joho/godotenv"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"

	"ccsync_backend/controllers"
	"ccsync_backend/middleware"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}

	controllers.GlobalJobQueue = controllers.NewJobQueue()
	// OAuth2 client credentials
	clientID := os.Getenv("CLIENT_ID")
	clientSecret := os.Getenv("CLIENT_SEC")
	redirectURL := os.Getenv("REDIRECT_URL_DEV")

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
		log.Fatal("SESSION_KEY environment variable is not set or empty")
	}
	store := sessions.NewCookieStore(sessionKey)
	gob.Register(map[string]interface{}{})

	app := controllers.App{Config: conf, SessionStore: store}
	mux := http.NewServeMux()

	// Allow 50 requests per 30 seconds per IP for testing
	rateLimitedHandler := middleware.RateLimitMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/auth/oauth":
			app.OAuthHandler(w, r)
		case "/auth/callback":
			app.OAuthCallbackHandler(w, r)
		case "/api/user":
			app.UserInfoHandler(w, r)
		case "/auth/logout":
			app.LogoutHandler(w, r)
		}
	}), 30*time.Second, 50)

	// API endpoints with rate limiting
	mux.Handle("/auth/oauth", rateLimitedHandler)
	mux.Handle("/auth/callback", rateLimitedHandler)
	mux.Handle("/api/user", rateLimitedHandler)
	mux.Handle("/auth/logout", rateLimitedHandler)

	// API endpoints without rate limiting
	mux.HandleFunc("/tasks", controllers.TasksHandler)
	mux.HandleFunc("/add-task", controllers.AddTaskHandler)
	mux.HandleFunc("/edit-task", controllers.EditTaskHandler)
	mux.HandleFunc("/modify-task", controllers.ModifyTaskHandler)
	mux.HandleFunc("/complete-task", controllers.CompleteTaskHandler)
	mux.HandleFunc("/delete-task", controllers.DeleteTaskHandler)
	mux.HandleFunc("/ws", controllers.WebSocketHandler)

	// --- important to keep the status notifier running ---
	go controllers.JobStatusManager()
	log.Println("Server started at :8000")
	if err := http.ListenAndServe(":8000", app.EnableCORS(mux)); err != nil {
		log.Fatal(err)
	}
}
