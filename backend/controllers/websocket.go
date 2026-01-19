package controllers

import (
	"net/http"
	"os"
	"strings"

	"ccsync_backend/utils"

	"github.com/gorilla/websocket"
)

type JobStatus struct {
	Job    string `json:"job"`
	Status string `json:"status"`
}

// checkWebSocketOrigin validates the Origin header against allowed origins
func checkWebSocketOrigin(r *http.Request) bool {
	origin := r.Header.Get("Origin")
	if origin == "" {
		// No origin header - could be same-origin or non-browser client
		return true
	}

	// Get allowed origin from environment (e.g., "https://taskwarrior-server.ccextractor.org")
	allowedOrigin := os.Getenv("ALLOWED_ORIGIN")

	// In development, allow localhost origins
	if os.Getenv("ENV") != "production" {
		if strings.HasPrefix(origin, "http://localhost") ||
			strings.HasPrefix(origin, "http://127.0.0.1") {
			return true
		}
	}

	// Check against configured allowed origin
	if allowedOrigin != "" && origin == allowedOrigin {
		return true
	}

	// If no ALLOWED_ORIGIN configured, check if origin matches the request host
	// This provides same-origin protection as fallback
	host := r.Host
	if strings.Contains(origin, host) {
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
