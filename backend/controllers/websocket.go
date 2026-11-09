package controllers

import (
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"

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
	Job      string `json:"job"`
	Status   string `json:"status"`
	ClientID string `json:"clientID,omitempty"`
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

// clients maps each WebSocket to the authenticated user's UUID.
var clients = make(map[*websocket.Conn]string)
var clientsMu sync.RWMutex
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

		// Prefer the session UUID over the clientID query param so a client
		// cannot subscribe to another user's job-status events.
		userUUID, _ := userInfo["uuid"].(string)
		if userUUID == "" {
			utils.Logger.Warnf("WebSocket auth failed: session user missing uuid")
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

		clientsMu.Lock()
		clients[ws] = userUUID
		clientsMu.Unlock()
		defer func() {
			clientsMu.Lock()
			delete(clients, ws)
			clientsMu.Unlock()
		}()

		for {
			_, _, err := ws.ReadMessage()
			if err != nil {
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

	// Unauthenticated legacy handler: register with an empty id so scoped
	// job-status events (which always carry a ClientID) are not delivered here.
	clientsMu.Lock()
	clients[ws] = ""
	clientsMu.Unlock()
	defer func() {
		clientsMu.Lock()
		delete(clients, ws)
		clientsMu.Unlock()
	}()

	for {
		_, _, err := ws.ReadMessage()
		if err != nil {
			break
		}
	}
}

func BroadcastJobStatus(jobStatus JobStatus) {
	broadcast <- jobStatus
}

// deliverJobStatus sends a job-status event only to WebSockets registered
// for the same ClientID as the job owner.
func deliverJobStatus(jobStatus JobStatus) {
	clientsMu.Lock()
	defer clientsMu.Unlock()

	for client, clientID := range clients {
		if jobStatus.ClientID == "" || clientID != jobStatus.ClientID {
			continue
		}
		if err := client.WriteJSON(jobStatus); err != nil {
			client.Close()
			delete(clients, client)
		}
	}
}

func JobStatusManager() {
	for {
		jobStatus := <-broadcast
		deliverJobStatus(jobStatus)
	}
}
