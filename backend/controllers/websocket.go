package controllers

import (
	"ccsync_backend/utils/logger"
	"net/http"

	"github.com/gorilla/websocket"
)

type JobStatus struct {
	Job    string `json:"job"`
	Status string `json:"status"`
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var clients = make(map[*websocket.Conn]bool)
var broadcast = make(chan JobStatus)

func WebSocketHandler(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		logger.Errorf("WebSocket upgrade error: %v", err)
		return
	}
	defer ws.Close()

	clients[ws] = true
	logger.Info("New WebSocket connection established")

	for {
		_, _, err := ws.ReadMessage()
		if err != nil {
			delete(clients, ws)
			logger.Debugf("WebSocket connection closed: %v", err)
			break
		}
	}
}

func BroadcastJobStatus(jobStatus JobStatus) {
	logger.Debug("Broadcasting job status", "job", jobStatus.Job, "status", jobStatus.Status)
	broadcast <- jobStatus
}

func JobStatusManager() {
	for {
		jobStatus := <-broadcast
		logger.Debug("Sending job status to clients", "job", jobStatus.Job, "status", jobStatus.Status)
		for client := range clients {
			err := client.WriteJSON(jobStatus)
			if err != nil {
				logger.Warnf("WebSocket write error: %v", err)
				client.Close()
				delete(clients, client)
			}
		}
	}
}
