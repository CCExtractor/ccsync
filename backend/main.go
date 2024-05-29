package main

import (
	"context"
	"encoding/gob"
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/sessions"
	"github.com/joho/godotenv"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

type App struct {
	config       *oauth2.Config
	sessionStore *sessions.CookieStore
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}

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

	app := App{config: conf, sessionStore: store}
	mux := http.NewServeMux()

	mux.HandleFunc("/auth/oauth", app.oAuthHandler)
	mux.HandleFunc("/auth/callback", app.oAuthCallbackHandler)
	mux.HandleFunc("/api/user", app.userInfoHandler)
	mux.HandleFunc("/auth/logout", app.logoutHandler)

	log.Println("Server started at :8000")
	if err := http.ListenAndServe(":8000", app.enableCORS(mux)); err != nil {
		log.Fatal(err)
	}
}

// this creates a unique OAuth URL and redirects the user
func (a *App) oAuthHandler(w http.ResponseWriter, r *http.Request) {
	url := a.config.AuthCodeURL("state", oauth2.AccessTypeOffline)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

// this exchanges the code for an access token and fetches user info
func (a *App) oAuthCallbackHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("Fetching user info...")

	code := r.URL.Query().Get("code")

	t, err := a.config.Exchange(context.Background(), code)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	client := a.config.Client(context.Background(), t)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	defer resp.Body.Close()

	var userInfo map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Store the user info in a session
	session, _ := a.sessionStore.Get(r, "session-name")
	session.Values["user"] = userInfo
	if err := session.Save(r, w); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Log the user info for troubleshooting
	log.Printf("User Info: %v", userInfo)

	frontendOriginDev := os.Getenv("FRONTEND_ORIGIN_DEV")
	http.Redirect(w, r, frontendOriginDev+"/home", http.StatusSeeOther)
}

// returns the authenticated user's info
func (a *App) userInfoHandler(w http.ResponseWriter, r *http.Request) {
	session, _ := a.sessionStore.Get(r, "session-name")
	userInfo, ok := session.Values["user"].(map[string]interface{})
	if !ok || userInfo == nil {
		http.Error(w, "No user info available", http.StatusUnauthorized)
		return
	}

	// Log user info
	log.Printf("Sending User Info: %v", userInfo)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(userInfo)
}

// enableCORS allows CORS from specific origins
func (a *App) enableCORS(handler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set the allowed origin
		allowedOrigin := os.Getenv("FRONTEND_ORIGIN_DEV") // frontend origin
		w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true") // to allow credentials
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		handler.ServeHTTP(w, r)
	})
}

// Logout handler clears user session data
func (a *App) logoutHandler(w http.ResponseWriter, r *http.Request) {
	session, _ := a.sessionStore.Get(r, "session-name")
	session.Options.MaxAge = -1
	if err := session.Save(r, w); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	log.Print("User has logged out")
}
