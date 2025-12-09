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
	utils.Logger.Info("New WebSocket connection established!")

	for {
		_, _, err := ws.ReadMessage()
		if err != nil {
			delete(clients, ws)
			utils.Logger.Info("WebSocket connection closed:", err)
			break
		}
	}
}

func BroadcastJobStatus(jobStatus JobStatus) {
	utils.Logger.Infof("Broadcasting: %+v", jobStatus)
	broadcast <- jobStatus
}

func JobStatusManager() {
	for {
		jobStatus := <-broadcast
		utils.Logger.Infof("Sending to clients: %+v", jobStatus)
		for client := range clients {
			err := client.WriteJSON(jobStatus)
			if err != nil {
				utils.Logger.Errorf("WebSocket Write Error: %v", err)
				client.Close()
				delete(clients, client)
			}
		}
	}
}
