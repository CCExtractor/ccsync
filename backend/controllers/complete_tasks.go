package controllers

import (
	"ccsync_backend/models"
	"ccsync_backend/utils/tw"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// BulkCompleteTaskHandler godoc
// @Summary Bulk complete tasks
// @Description Mark multiple tasks as completed in Taskwarrior
// @Tags Tasks
// @Accept json
// @Produce json
// @Param task body models.BulkCompleteTaskRequestBody true "Bulk task completion details"
// @Success 202 {string} string "Bulk task completion accepted for processing"
// @Failure 400 {string} string "Invalid request - missing or empty taskuuids"
// @Failure 405 {string} string "Method not allowed"
// @Router /complete-tasks [post]
func BulkCompleteTaskHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, fmt.Sprintf("error reading request body: %v", err), http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	var requestBody models.BulkCompleteTaskRequestBody

	if err := json.Unmarshal(body, &requestBody); err != nil {
		http.Error(w, fmt.Sprintf("error decoding request body: %v", err), http.StatusBadRequest)
		return
	}

	email := requestBody.Email
	encryptionSecret := requestBody.EncryptionSecret
	uuid := requestBody.UUID
	taskUUIDs := requestBody.TaskUUIDs

	if len(taskUUIDs) == 0 {
		http.Error(w, "taskuuids is required and cannot be empty", http.StatusBadRequest)
		return
	}

	logStore := models.GetLogStore()

	// Create a *single* job for all UUIDs
	job := Job{
		Name: "Bulk Complete Tasks",
		Execute: func() error {
			for _, tu := range taskUUIDs {
				logStore.AddLog("INFO", fmt.Sprintf("[Bulk Complete] Starting: %s", tu), uuid, "Bulk Complete Task")

				err := tw.CompleteTaskInTaskwarrior(email, encryptionSecret, uuid, tu)
				if err != nil {
					logStore.AddLog("ERROR", fmt.Sprintf("[Bulk Complete] Failed: %s (%v)", tu, err), uuid, "Bulk Complete Task")
					continue
				}

				logStore.AddLog("INFO", fmt.Sprintf("[Bulk Complete] Completed: %s", tu), uuid, "Bulk Complete Task")
			}
			return nil
		},
	}

	GlobalJobQueue.AddJob(job)
	w.WriteHeader(http.StatusAccepted)
}
