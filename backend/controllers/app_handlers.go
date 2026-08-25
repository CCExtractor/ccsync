package controllers

import (
	"ccsync_backend/utils"
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"os"
	"strings"

	"github.com/gorilla/sessions"
	"golang.org/x/oauth2"
)

// generateOAuthState creates a cryptographically secure random state string
func generateOAuthState() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

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
// @Failure 500 {string} string "Internal server error"
// @Router /auth/oauth [get]
func (a *App) OAuthHandler(w http.ResponseWriter, r *http.Request) {
	// Generate a cryptographically secure random state to prevent CSRF attacks
	state, err := generateOAuthState()
	if err != nil {
		utils.Logger.Errorf("Failed to generate OAuth state: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Store state in session for validation in callback
	session, _ := a.SessionStore.Get(r, "session-name")
	session.Values["oauth_state"] = state
	if err := utils.SaveSessionWithSecureCookie(session, r, w); err != nil {
		utils.Logger.Errorf("Failed to save OAuth state to session: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	url := a.Config.AuthCodeURL(state, oauth2.AccessTypeOffline)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

// OAuthCallbackHandler godoc
// @Summary OAuth callback handler
// @Description Handles the OAuth callback and creates user session
// @Tags Auth
// @Accept json
// @Produce json
// @Param code query string true "OAuth authorization code"
// @Param state query string true "OAuth state parameter for CSRF protection"
// @Success 303 {string} string "Redirect to frontend home page"
// @Failure 400 {string} string "Bad request"
// @Failure 403 {string} string "Invalid OAuth state"
// @Failure 500 {string} string "Internal server error"
// @Router /auth/callback [get]
func (a *App) OAuthCallbackHandler(w http.ResponseWriter, r *http.Request) {
	// Validate OAuth state parameter to prevent CSRF attacks
	state := r.URL.Query().Get("state")
	session, _ := a.SessionStore.Get(r, "session-name")
	expectedState, ok := session.Values["oauth_state"].(string)
	if !ok || state == "" || state != expectedState {
		utils.Logger.Warnf("OAuth state mismatch: expected=%s, got=%s", expectedState, state)
		http.Error(w, "Invalid OAuth state", http.StatusForbidden)
		return
	}
	// Clear the state from session after validation (one-time use)
	delete(session.Values, "oauth_state")

	code := r.URL.Query().Get("code")

	t, err := a.Config.Exchange(context.Background(), code)
	if err != nil {
		utils.Logger.Errorf("OAuth token exchange failed: %v", err)
		http.Error(w, "Authentication failed", http.StatusBadRequest)
		return
	}

	client := a.Config.Client(context.Background(), t)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		utils.Logger.Errorf("Failed to fetch user info from Google: %v", err)
		http.Error(w, "Authentication failed", http.StatusBadRequest)
		return
	}
	defer resp.Body.Close()

	var userInfo map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		utils.Logger.Errorf("Failed to decode user info: %v", err)
		http.Error(w, "Authentication failed", http.StatusInternalServerError)
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
	session.Values["user"] = userInfo
	if err := utils.SaveSessionWithSecureCookie(session, r, w); err != nil {
		utils.Logger.Errorf("Failed to save session: %v", err)
		http.Error(w, "Session error", http.StatusInternalServerError)
		return
	}

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

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(userInfo)
}

// isOriginAllowed checks if the request origin is allowed
func isOriginAllowed(origin, allowedOrigin string) bool {
	if origin == "" {
		// No origin header - could be same-origin or non-browser client
		return true
	}
	if allowedOrigin != "" && origin == allowedOrigin {
		return true
	}
	// In development, allow localhost origins
	if os.Getenv("ENV") != "production" {
		if strings.HasPrefix(origin, "http://localhost") ||
			strings.HasPrefix(origin, "http://127.0.0.1") {
			return true
		}
	}
	return false
}

func (a *App) EnableCORS(handler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		allowedOrigin := os.Getenv("FRONTEND_ORIGIN_DEV") // frontend origin
		requestOrigin := r.Header.Get("Origin")

		// For state-changing requests (POST, PUT, DELETE), validate Origin header
		// This provides additional CSRF protection beyond SameSite cookies
		if r.Method == http.MethodPost || r.Method == http.MethodPut || r.Method == http.MethodDelete {
			if !isOriginAllowed(requestOrigin, allowedOrigin) {
				utils.Logger.Warnf("CSRF protection: rejected request from origin: %s", requestOrigin)
				http.Error(w, "Forbidden", http.StatusForbidden)
				return
			}
		}

		// Set CORS headers
		if requestOrigin != "" && isOriginAllowed(requestOrigin, allowedOrigin) {
			w.Header().Set("Access-Control-Allow-Origin", requestOrigin)
		} else if allowedOrigin != "" {
			w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
		}
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-Email, X-Encryption-Secret, X-User-UUID")
		w.Header().Set("Access-Control-Allow-Credentials", "true") // to allow credentials
		w.Header().Add("Vary", "Origin")                           // prevent caching issues with different origins

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
	if err := utils.SaveSessionWithSecureCookie(session, r, w); err != nil {
		utils.Logger.Errorf("Failed to clear session on logout: %v", err)
		http.Error(w, "Logout failed", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
