package controllers

import (
	"ccsync_backend/utils/tw"
	"encoding/json"
	"net/http"
	"os"
	"sort"
)

// Priority value mapping
func getPriorityValue(priority string) int {
	switch priority {
	case "H":
		return 3
	case "M":
		return 2
	case "L":
		return 1
	default:
		return 0
	}
}

// helps to fetch tasks using '/tasks' route
func TasksHandler(w http.ResponseWriter, r *http.Request) {
	email := r.URL.Query().Get("email")
	encryptionSecret := r.URL.Query().Get("encryptionSecret")
	UUID := r.URL.Query().Get("UUID")
	sortBy := r.URL.Query().Get("sort") // New query parameter for sorting

	origin := os.Getenv("CONTAINER_ORIGIN")
	if email == "" || encryptionSecret == "" || UUID == "" {
		http.Error(w, "Missing required parameters", http.StatusBadRequest)
		return
	}

	if r.Method == http.MethodGet {
		tasks, err := tw.FetchTasksFromTaskwarrior(email, encryptionSecret, origin, UUID)
		if err != nil || tasks == nil {
			http.Error(w, "Failed to fetch tasks at backend", http.StatusInternalServerError)
			return
		}

		if sortBy == "priority" {
			sort.Slice(tasks, func(i, j int) bool {
				return getPriorityValue(tasks[i].Priority) > getPriorityValue(tasks[j].Priority)
			})
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(tasks)
		return
	}

	http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
}
