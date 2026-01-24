package controllers

import (
	"net/http"
	"net/url"
	"os"
	"strings"

	"ccsync_backend/utils"

	"github.com/gorilla/sessions"
	"github.com/gorilla/websocket"
)

// getEnv returns the environment mode, defaulting to "development"
func getEnv() string {
	env := os.Getenv("ENV")
	if env == "" {
		return "development"
	}
	return env
}

type JobStatus struct {
	Job    string `json:"job"`
	Status string `json:"status"`
}

// checkWebSocketOrigin validates the Origin header against allowed origins
func checkWebSocketOrigin(r *http.Request) bool {
	origin := r.Header.Get("Origin")

	// In development mode, be more permissive
	if getEnv() != "production" {
		if origin == "" ||
			strings.HasPrefix(origin, "http://localhost") ||
			strings.HasPrefix(origin, "http://127.0.0.1") {
			return true
		}
	}

	// In production, require an origin header
	if origin == "" {
		utils.Logger.Warn("WebSocket connection rejected: missing Origin header in production")
		return false
	}

	// Check against configured allowed origin (exact match)
	allowedOrigin := os.Getenv("ALLOWED_ORIGIN")
	if allowedOrigin != "" && origin == allowedOrigin {
		return true
	}

	// Fallback: parse origin and compare hostname exactly with request host
	parsedOrigin, err := url.Parse(origin)
	if err != nil {
		utils.Logger.Warnf("WebSocket connection rejected: invalid origin URL: %s", origin)
		return false
	}

	// Extract hostname from request Host header (may include port)
	requestHost := r.Host
	if idx := strings.LastIndex(requestHost, ":"); idx != -1 {
		// Be careful with IPv6 addresses like [::1]:8080
		if !strings.HasPrefix(requestHost, "[") || idx > strings.Index(requestHost, "]") {
			requestHost = requestHost[:idx]
		}
	}

	// Exact hostname comparison
	if parsedOrigin.Hostname() == requestHost {
		return true
	}

	utils.Logger.Warnf("WebSocket connection rejected from origin: %s", origin)
	return false
}

var upgrader = websocket.Upgrader{
	CheckOrigin: checkWebSocketOrigin,
}

var clients = make(map[*websocket.Conn]bool)
var broadcast = make(chan JobStatus)

// AuthenticatedWebSocketHandler creates a WebSocket handler that requires authentication
func AuthenticatedWebSocketHandler(store *sessions.CookieStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Validate session before upgrading to WebSocket
		session, err := store.Get(r, "session-name")
		if err != nil {
			utils.Logger.Warnf("WebSocket auth failed: could not get session: %v", err)
			http.Error(w, "Authentication required", http.StatusUnauthorized)
			return
		}

		userInfo, ok := session.Values["user"].(map[string]interface{})
		if !ok || userInfo == nil {
			utils.Logger.Warnf("WebSocket auth failed: no user in session")
			http.Error(w, "Authentication required", http.StatusUnauthorized)
			return
		}

		// User is authenticated, proceed with WebSocket upgrade
		ws, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			utils.Logger.Error("WebSocket Upgrade Error:", err)
			return
		}
		defer ws.Close()

		clients[ws] = true
		for {
			_, _, err := ws.ReadMessage()
			if err != nil {
				delete(clients, ws)
				break
			}
		}
	}
}

// WebSocketHandler is kept for backward compatibility but should not be used
// Use AuthenticatedWebSocketHandler instead
func WebSocketHandler(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		utils.Logger.Error("WebSocket Upgrade Error:", err)
		return
	}
	defer ws.Close()

	clients[ws] = true
	for {
		_, _, err := ws.ReadMessage()
		if err != nil {
			delete(clients, ws)
			break
		}
	}
}

func BroadcastJobStatus(jobStatus JobStatus) {
	broadcast <- jobStatus
}

func JobStatusManager() {
	for {
		jobStatus := <-broadcast
		for client := range clients {
			err := client.WriteJSON(jobStatus)
			if err != nil {
				client.Close()
				delete(clients, client)
			}
		}
	}
}
