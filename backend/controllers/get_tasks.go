package controllers

import (
	"ccsync_backend/utils/tw"
	"encoding/json"
	"net/http"
	"os"
)

// TasksHandler godoc
// @Summary Get all tasks
// @Description Fetch all tasks from Taskwarrior for a specific user via Headers
// @Tags Tasks
// @Accept json
// @Produce json
// @Param X-User-Email header string true "User email"
// @Param X-Encryption-Secret header string true "Encryption secret"
// @Param X-User-UUID header string true "User UUID"
// @Success 200 {array} models.Task "List of tasks"
// @Failure 400 {string} string "Missing required headers"
// @Failure 500 {string} string "Failed to fetch tasks at backend"
// @Router /tasks [get]
func TasksHandler(w http.ResponseWriter, r *http.Request) {
	// Extracting from Headers instead of Query Params
	email := r.Header.Get("X-User-Email")
	encryptionSecret := r.Header.Get("X-Encryption-Secret")
	UUID := r.Header.Get("X-User-UUID")

	origin := os.Getenv("CONTAINER_ORIGIN")

	if email == "" || encryptionSecret == "" || UUID == "" {
		http.Error(w, "Missing required security headers", http.StatusBadRequest)
		return
	}

	if r.Method == http.MethodGet {
		tasks, err := tw.FetchTasksFromTaskwarrior(email, encryptionSecret, origin, UUID)
		if err != nil || tasks == nil {
			http.Error(w, "Failed to fetch tasks at backend", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(tasks)
		return
	}

	http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
}
