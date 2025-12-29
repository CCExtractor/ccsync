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
	email, uuid, encryptionSecret, err := GetSessionCredentials(r)
	if err != nil {
		http.Error(w, "Authentication required", http.StatusUnauthorized)
		return
	}

	queryEmail := r.URL.Query().Get("email")
	queryUUID := r.URL.Query().Get("UUID")

	if queryEmail != "" || queryUUID != "" {
		if err := ValidateUserCredentials(r, queryEmail, queryUUID); err != nil {
			http.Error(w, "Invalid credentials", http.StatusForbidden)
			return
		}
	}

	if r.Method == http.MethodGet {
		origin := os.Getenv("CONTAINER_ORIGIN")
		tasks, _ := tw.FetchTasksFromTaskwarrior(email, encryptionSecret, origin, uuid)
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
