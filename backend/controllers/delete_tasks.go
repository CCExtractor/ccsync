package controllers

import (
	"ccsync_backend/models"
	"ccsync_backend/utils/tw"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// BulkDeleteTaskHandler godoc
// @Summary Bulk delete tasks
// @Description Delete multiple tasks in Taskwarrior
// @Tags Tasks
// @Accept json
// @Produce json
// @Param task body models.BulkDeleteTaskRequestBody true "Bulk task deletion details"
// @Success 202 {string} string "Bulk task deletion accepted for processing"
// @Failure 400 {string} string "Invalid request - missing or empty taskuuids"
// @Failure 405 {string} string "Method not allowed"
// @Router /delete-tasks [post]
func BulkDeleteTaskHandler(w http.ResponseWriter, r *http.Request) {
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

	var requestBody models.BulkDeleteTaskRequestBody

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

	job := Job{
		Name: "Bulk Delete Tasks",
		Execute: func() error {
			logStore.AddLog("INFO", fmt.Sprintf("[Bulk Delete] Starting %d tasks", len(taskUUIDs)), uuid, "Bulk Delete Task")

			failedTasks, err := tw.DeleteTasksInTaskwarrior(email, encryptionSecret, uuid, taskUUIDs)

			for taskUUID, errMsg := range failedTasks {
				logStore.AddLog("ERROR", fmt.Sprintf("[Bulk Delete] Failed: %s (%s)", taskUUID, errMsg), uuid, "Bulk Delete Task")
			}

			if err != nil {
				logStore.AddLog("ERROR", fmt.Sprintf("[Bulk Delete] Sync error: %v", err), uuid, "Bulk Delete Task")
				return err
			}

			successCount := len(taskUUIDs) - len(failedTasks)
			logStore.AddLog("INFO", fmt.Sprintf("[Bulk Delete] Finished: %d succeeded, %d failed", successCount, len(failedTasks)), uuid, "Bulk Delete Task")

			return nil
		},
	}

	GlobalJobQueue.AddJob(job)
	w.WriteHeader(http.StatusAccepted)
}
