package main

import (
	"context"
	"crypto/sha256"
	"encoding/gob"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/google/uuid"
	"github.com/gorilla/sessions"
	"github.com/joho/godotenv"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

type App struct {
	Config           *oauth2.Config
	SessionStore     *sessions.CookieStore
	UserEmail        string
	EncryptionSecret string
	UUID             string
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

	app := App{Config: conf, SessionStore: store}
	mux := http.NewServeMux()

	mux.HandleFunc("/auth/oauth", app.OAuthHandler)
	mux.HandleFunc("/auth/callback", app.OAuthCallbackHandler)
	mux.HandleFunc("/api/user", app.UserInfoHandler)
	mux.HandleFunc("/auth/logout", app.LogoutHandler)
	mux.HandleFunc("/tasks", app.tasksHandler)
	mux.HandleFunc("/add-task", addTaskHandler)
	mux.HandleFunc("/edit-task", editTaskHandler)
	mux.HandleFunc("/complete-task", completeTaskHandler)
	mux.HandleFunc("/sync-tasks", syncTasksHandler)

	log.Println("Server started at :8000")
	if err := http.ListenAndServe(":8000", app.EnableCORS(mux)); err != nil {
		log.Fatal(err)
	}
}

// this creates a unique OAuth URL and redirects the user
func (a *App) OAuthHandler(w http.ResponseWriter, r *http.Request) {
	url := a.Config.AuthCodeURL("state", oauth2.AccessTypeOffline)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

// this exchanges the code for an access token and fetches user info
func (a *App) OAuthCallbackHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("Fetching user info...")

	code := r.URL.Query().Get("code")

	t, err := a.Config.Exchange(context.Background(), code)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	client := a.Config.Client(context.Background(), t)
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

	// Generate a UUID based on email and id
	email, okEmail := userInfo["email"].(string)
	id, okId := userInfo["id"].(string)
	if !okEmail || !okId {
		http.Error(w, "Unable to retrieve user info", http.StatusInternalServerError)
		return
	}
	uuidStr := GenerateUUID(email, id)

	// Generate an encryption secret based on the UUID, email, and id
	encryptionSecret := GenerateEncryptionSecret(uuidStr, email, id)

	// Store the data in a session
	userInfo["uuid"] = uuidStr
	userInfo["encryption_secret"] = encryptionSecret
	session, _ := a.SessionStore.Get(r, "session-name")
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

// generate a UUID based on email and id
func GenerateUUID(email, id string) string {
	namespace := uuid.NewMD5(uuid.NameSpaceOID, []byte(email+id))
	return namespace.String()
}

// generate a secret based on UUID, email, and id
func GenerateEncryptionSecret(uuidStr, email, id string) string {
	hash := sha256.New()
	hash.Write([]byte(uuidStr + email + id))
	return hex.EncodeToString(hash.Sum(nil))
}

// returns the authenticated user's info
func (a *App) UserInfoHandler(w http.ResponseWriter, r *http.Request) {
	session, _ := a.SessionStore.Get(r, "session-name")
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
func (a *App) EnableCORS(handler http.Handler) http.Handler {
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

func (a *App) tasksHandler(w http.ResponseWriter, r *http.Request) {
	email := r.URL.Query().Get("email")
	encryptionSecret := r.URL.Query().Get("encryptionSecret")
	UUID := r.URL.Query().Get("UUID")
	origin := os.Getenv("CONTAINER_ORIGIN")
	if email == "" || encryptionSecret == "" || UUID == "" {
		http.Error(w, "Missing required parameters", http.StatusBadRequest)
		return
	}

	if r.Method == http.MethodGet {
		tasks, _ := fetchTasksFromTaskwarrior(email, encryptionSecret, origin, UUID)
		if tasks == nil {
			http.Error(w, "Failed to fetch tasks", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(tasks)
		return
	}

	http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
}

func completeTaskHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		body, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, fmt.Sprintf("error reading request body: %v", err), http.StatusBadRequest)
			return
		}
		defer r.Body.Close()

		fmt.Printf("Raw request body: %s\n", string(body))

		var requestBody struct {
			Email            string `json:"email"`
			EncryptionSecret string `json:"encryptionSecret"`
			UUID             string `json:"UUID"`
			TaskUUID         string `json:"taskuuid"`
		}

		err = json.Unmarshal(body, &requestBody)
		if err != nil {
			http.Error(w, fmt.Sprintf("error decoding request body: %v", err), http.StatusBadRequest)
			return
		}

		email := requestBody.Email
		encryptionSecret := requestBody.EncryptionSecret
		uuid := requestBody.UUID
		taskuuid := requestBody.TaskUUID

		if taskuuid == "" {
			http.Error(w, "taskuuid is required", http.StatusBadRequest)
			return
		}

		if err := CompleteTaskInTaskwarrior(email, encryptionSecret, uuid, taskuuid); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		http.Redirect(w, r, "/tasks", http.StatusSeeOther)
		return
	}
	http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
}

func addTaskHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		body, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, fmt.Sprintf("error reading request body: %v", err), http.StatusBadRequest)
			return
		}
		defer r.Body.Close()
		fmt.Printf("Raw request body: %s\n", string(body))

		var requestBody struct {
			Email            string `json:"email"`
			EncryptionSecret string `json:"encryptionSecret"`
			UUID             string `json:"UUID"`
			Description      string `json:"description"`
			Project          string `json:"project"`
			Priority         string `json:"priority"`
		}

		err = json.Unmarshal(body, &requestBody)
		if err != nil {
			http.Error(w, fmt.Sprintf("error decoding request body: %v", err), http.StatusBadRequest)
			return
		}
		email := requestBody.Email
		encryptionSecret := requestBody.EncryptionSecret
		uuid := requestBody.UUID
		description := requestBody.Description
		project := requestBody.Project
		priority := requestBody.Priority

		if description == "" {
			http.Error(w, "description is required", http.StatusBadRequest)
			return
		}

		if err := AddTaskToTaskwarrior(email, encryptionSecret, uuid, description, project, priority); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		http.Redirect(w, r, "/tasks", http.StatusSeeOther)
		return
	}
	http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
}

// Logout handler clears user session data
func (a *App) LogoutHandler(w http.ResponseWriter, r *http.Request) {
	session, _ := a.SessionStore.Get(r, "session-name")
	session.Options.MaxAge = -1
	if err := session.Save(r, w); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	log.Print("User has logged out")
}
