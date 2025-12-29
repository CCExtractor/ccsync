package controllers

import (
	"ccsync_backend/models"
	"ccsync_backend/utils/tw"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// DeleteTaskHandler godoc
// @Summary Delete a task
// @Description Delete a task from Taskwarrior
// @Tags Tasks
// @Accept json
// @Produce json
// @Param task body models.DeleteTaskRequestBody true "Task deletion details"
// @Success 202 {string} string "Task deletion accepted for processing"
// @Failure 400 {string} string "Bad request - invalid input or missing taskuuid"
// @Failure 405 {string} string "Method not allowed"
// @Router /delete-task [post]
func DeleteTaskHandler(w http.ResponseWriter, r *http.Request) {
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

		var requestBody models.DeleteTaskRequestBody

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
			Name: "Delete Task",
			Execute: func() error {
				logStore.AddLog("INFO", fmt.Sprintf("Deleting task UUID: %s", taskuuid), uuid, "Delete Task")
				err := tw.DeleteTaskInTaskwarrior(email, encryptionSecret, uuid, taskuuid)
				if err != nil {
					logStore.AddLog("ERROR", fmt.Sprintf("Failed to delete task UUID %s: %v", taskuuid, err), uuid, "Delete Task")
					return err
				}
				logStore.AddLog("INFO", fmt.Sprintf("Successfully deleted task UUID: %s", taskuuid), uuid, "Delete Task")
				return nil
			},
		}
		GlobalJobQueue.AddJob(job)
		w.WriteHeader(http.StatusAccepted)
		return
	}
	http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
}
