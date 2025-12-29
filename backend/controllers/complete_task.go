package controllers

import (
	"ccsync_backend/models"
	"ccsync_backend/utils/tw"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// CompleteTaskHandler godoc
// @Summary Complete a task
// @Description Mark a task as completed in Taskwarrior
// @Tags Tasks
// @Accept json
// @Produce json
// @Param task body models.CompleteTaskRequestBody true "Task completion details"
// @Success 202 {string} string "Task completion accepted for processing"
// @Failure 400 {string} string "Bad request - invalid input or missing taskuuid"
// @Failure 405 {string} string "Method not allowed"
// @Router /complete-task [post]
func CompleteTaskHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		email, uuid, encryptionSecret, err := GetSessionCredentials(r)
		if err != nil {
			http.Error(w, "Authentication required", http.StatusUnauthorized)
			return
		}

		body, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, fmt.Sprintf("error reading request body: %v", err), http.StatusBadRequest)
			return
		}
		defer r.Body.Close()

		var requestBody models.CompleteTaskRequestBody

		err = json.Unmarshal(body, &requestBody)
		if err != nil {
			http.Error(w, fmt.Sprintf("error decoding request body: %v", err), http.StatusBadRequest)
			return
		}

		if requestBody.Email != "" || requestBody.UUID != "" {
			if err := ValidateUserCredentials(r, requestBody.Email, requestBody.UUID); err != nil {
				http.Error(w, "Invalid credentials", http.StatusForbidden)
				return
			}
		}

		taskuuid := requestBody.TaskUUID

		if taskuuid == "" {
			http.Error(w, "taskuuid is required", http.StatusBadRequest)
			return
		}

		logStore := models.GetLogStore()
		job := Job{
			Name: "Complete Task",
			Execute: func() error {
				logStore.AddLog("INFO", fmt.Sprintf("Completing task UUID: %s", taskuuid), uuid, "Complete Task")
				err := tw.CompleteTaskInTaskwarrior(email, encryptionSecret, uuid, taskuuid)
				if err != nil {
					logStore.AddLog("ERROR", fmt.Sprintf("Failed to complete task UUID %s: %v", taskuuid, err), uuid, "Complete Task")
					return err
				}
				logStore.AddLog("INFO", fmt.Sprintf("Successfully completed task UUID: %s", taskuuid), uuid, "Complete Task")
				return nil
			},
		}
		GlobalJobQueue.AddJob(job)
		w.WriteHeader(http.StatusAccepted)
		return
	}
	http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
}
