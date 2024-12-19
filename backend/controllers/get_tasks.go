package controllers

import (
	"ccsync_backend/utils/tw"
	"encoding/json"
	"net/http"
	"os"
)

// helps to fetch tasks using '/tasks' route
func TasksHandler(w http.ResponseWriter, r *http.Request) {
	email := r.URL.Query().Get("email")
	encryptionSecret := r.URL.Query().Get("encryptionSecret")
	UUID := r.URL.Query().Get("UUID")
	origin := os.Getenv("CONTAINER_ORIGIN")
	if email == "" || encryptionSecret == "" || UUID == "" {
		http.Error(w, "Missing required parameters", http.StatusBadRequest)
		return
	}

	if r.Method == http.MethodGet {
		tasks, _ := tw.FetchTasksFromTaskwarrior(email, encryptionSecret, origin, UUID)
		if tasks == nil {
			http.Error(w, "Failed to fetch tasks", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(tasks)
		return
	}

	http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
}
