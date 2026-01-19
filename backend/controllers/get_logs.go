package controllers

import (
	"ccsync_backend/models"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/sessions"
)

// SyncLogsHandler godoc
// @Summary Get sync logs
// @Description Fetch the latest sync operation logs for the authenticated user
// @Tags Logs
// @Accept json
// @Produce json
// @Param last query int false "Number of latest log entries to return (default: 20, max: 20)"
// @Success 200 {array} models.LogEntry "List of log entries"
// @Failure 400 {string} string "Invalid last parameter"
// @Failure 401 {string} string "Authentication required"
// @Router /sync/logs [get]
func SyncLogsHandler(store *sessions.CookieStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		// Validate session - user must be authenticated to view logs
		session, err := store.Get(r, "session-name")
		if err != nil {
			http.Error(w, "Authentication required", http.StatusUnauthorized)
			return
		}

		userInfo, ok := session.Values["user"].(map[string]interface{})
		if !ok || userInfo == nil {
			http.Error(w, "Authentication required", http.StatusUnauthorized)
			return
		}

		// Get user's UUID to filter logs
		userUUID, _ := userInfo["uuid"].(string)

		// Get the 'last' query parameter, default to 20, max 20
		const maxLogs = 20
		lastParam := r.URL.Query().Get("last")
		last := maxLogs
		if lastParam != "" {
			parsedLast, err := strconv.Atoi(lastParam)
			if err != nil || parsedLast < 0 {
				http.Error(w, "Invalid 'last' parameter", http.StatusBadRequest)
				return
			}
			last = parsedLast
		}
		// Enforce hard cap to prevent resource exhaustion
		if last > maxLogs {
			last = maxLogs
		}

		// Get the log store and retrieve logs filtered by user UUID
		logStore := models.GetLogStore()
		logs := logStore.GetLogsByUser(last, userUUID)

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(logs); err != nil {
			http.Error(w, "Failed to encode logs", http.StatusInternalServerError)
			return
		}
	}
}
