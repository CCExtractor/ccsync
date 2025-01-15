package controllers

import (
	"log"
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
		log.Println("WebSocket Upgrade Error:", err)
		return
	}
	defer ws.Close()

	clients[ws] = true
	log.Println("New WebSocket connection established!")

	for {
		_, _, err := ws.ReadMessage()
		if err != nil {
			delete(clients, ws)
			log.Println("WebSocket connection closed:", err)
			break
		}
	}
}

func BroadcastJobStatus(jobStatus JobStatus) {
	log.Printf("Broadcasting: %+v\n", jobStatus)
	broadcast <- jobStatus
}

func JobStatusManager() {
	for {
		jobStatus := <-broadcast
		log.Printf("Sending to clients: %+v\n", jobStatus)
		for client := range clients {
			err := client.WriteJSON(jobStatus)
			if err != nil {
				log.Printf("WebSocket Write Error: %v\n", err)
				client.Close()
				delete(clients, client)
			}
		}
	}
}
