package controllers

import (
	
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
		Logger.Errorf("WebSocket upgrade error: %v", err)
		return
	}
	defer ws.Close()

	clients[ws] = true
	Logger.Info("New WebSocket connection established")

	for {
		_, _, err := ws.ReadMessage()
		if err != nil {
			delete(clients, ws)
			Logger.Debugf("WebSocket connection closed: %v", err)
			break
		}
	}
}

func BroadcastJobStatus(jobStatus JobStatus) {
	Logger.Debug("Broadcasting job status", "job", jobStatus.Job, "status", jobStatus.Status)
	broadcast <- jobStatus
}

func JobStatusManager() {
	for {
		jobStatus := <-broadcast
		Logger.Debug("Sending job status to clients", "job", jobStatus.Job, "status", jobStatus.Status)
		for client := range clients {
			err := client.WriteJSON(jobStatus)
			if err != nil {
				Logger.Warnf("WebSocket write error: %v", err)
				client.Close()
				delete(clients, client)
			}
		}
	}
}
