package controllers

import (
	"net/http"

	"ccsync_backend/utils"

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
