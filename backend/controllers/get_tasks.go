package controllers

import (
	"ccsync_backend/utils/tw"
	"encoding/json"
	"net/http"
	"os"
)

// TasksHandler godoc
// @Summary Get all tasks
// @Description Fetch all tasks from Taskwarrior for a specific user
// @Tags Tasks
// @Accept json
// @Produce json
// @Param email query string true "User email"
// @Param encryptionSecret query string true "Encryption secret for the user"
// @Param UUID query string true "User UUID"
// @Success 200 {array} models.Task "List of tasks"
// @Failure 400 {string} string "Missing required parameters"
// @Failure 500 {string} string "Failed to fetch tasks at backend"
// @Router /tasks [get]
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
			http.Error(w, "Failed to fetch tasks at backend", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(tasks)
		return
	}

	http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
}
