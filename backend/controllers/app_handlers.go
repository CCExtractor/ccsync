package controllers

import (
	"ccsync_backend/utils"
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/sessions"
	"golang.org/x/oauth2"
)

type App struct {
	Config           *oauth2.Config
	SessionStore     *sessions.CookieStore
	UserEmail        string
	EncryptionSecret string
	UUID             string
}

// OAuthHandler godoc
// @Summary Initiate OAuth login
// @Description Redirects user to Google OAuth login page
// @Tags Auth
// @Accept json
// @Produce json
// @Success 307 {string} string "Redirect to OAuth provider"
// @Router /auth/oauth [get]
func (a *App) OAuthHandler(w http.ResponseWriter, r *http.Request) {
	url := a.Config.AuthCodeURL("state", oauth2.AccessTypeOffline)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

// OAuthCallbackHandler godoc
// @Summary OAuth callback handler
// @Description Handles the OAuth callback and creates user session
// @Tags Auth
// @Accept json
// @Produce json
// @Param code query string true "OAuth authorization code"
// @Success 303 {string} string "Redirect to frontend home page"
// @Failure 400 {string} string "Bad request"
// @Failure 500 {string} string "Internal server error"
// @Router /auth/callback [get]
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

	email, okEmail := userInfo["email"].(string)
	id, okId := userInfo["id"].(string)
	if !okEmail || !okId {
		http.Error(w, "Unable to retrieve user info", http.StatusInternalServerError)
		return
	}
	uuidStr := utils.GenerateUUID(email, id)
	encryptionSecret := utils.GenerateEncryptionSecret(uuidStr, email, id)

	userInfo["uuid"] = uuidStr
	userInfo["encryption_secret"] = encryptionSecret
	session, _ := a.SessionStore.Get(r, "session-name")
	session.Values["user"] = userInfo
	if err := session.Save(r, w); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.Printf("User Info: %v", userInfo)

	frontendOriginDev := os.Getenv("FRONTEND_ORIGIN_DEV")
	http.Redirect(w, r, frontendOriginDev+"/home", http.StatusSeeOther)
}

// UserInfoHandler godoc
// @Summary Get user information
// @Description Retrieve user information from the session
// @Tags Auth
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{} "User information including email, id, uuid, and encryption_secret"
// @Failure 401 {string} string "No user info available - user not authenticated"
// @Router /api/user [get]
func (a *App) UserInfoHandler(w http.ResponseWriter, r *http.Request) {
	session, _ := a.SessionStore.Get(r, "session-name")
	userInfo, ok := session.Values["user"].(map[string]interface{})
	if !ok || userInfo == nil {
		http.Error(w, "No user info available", http.StatusUnauthorized)
		return
	}

	log.Printf("Sending User Info: %v", userInfo)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(userInfo)
}

func (a *App) EnableCORS(handler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
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

// LogoutHandler godoc
// @Summary Logout user
// @Description Logout user and delete session
// @Tags Auth
// @Accept json
// @Produce json
// @Success 200 {string} string "Successfully logged out"
// @Failure 500 {string} string "Internal server error"
// @Router /auth/logout [get]
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
