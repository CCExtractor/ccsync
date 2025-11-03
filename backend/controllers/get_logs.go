package controllers

import (
	"ccsync_backend/models"
	"encoding/json"
	"net/http"
	"strconv"
)

// SyncLogsHandler godoc
// @Summary Get sync logs
// @Description Fetch the latest sync operation logs
// @Tags Logs
// @Accept json
// @Produce json
// @Param last query int false "Number of latest log entries to return (default: 100)"
// @Success 200 {array} models.LogEntry "List of log entries"
// @Failure 400 {string} string "Invalid last parameter"
// @Router /sync/logs [get]
func SyncLogsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	// Get the 'last' query parameter, default to 100
	lastParam := r.URL.Query().Get("last")
	last := 100
	if lastParam != "" {
		parsedLast, err := strconv.Atoi(lastParam)
		if err != nil || parsedLast < 0 {
			http.Error(w, "Invalid 'last' parameter", http.StatusBadRequest)
			return
		}
		last = parsedLast
	}

	// Get the log store and retrieve logs
	logStore := models.GetLogStore()
	logs := logStore.GetLogs(last)

	// Return logs as JSON
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(logs); err != nil {
		http.Error(w, "Failed to encode logs", http.StatusInternalServerError)
		return
	}
}
