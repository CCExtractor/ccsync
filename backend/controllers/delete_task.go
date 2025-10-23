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

		email := requestBody.Email
		encryptionSecret := requestBody.EncryptionSecret
		uuid := requestBody.UUID
		taskuuid := requestBody.TaskUUID

		if taskuuid == "" {
			http.Error(w, "taskuuid is required", http.StatusBadRequest)
			return
		}

		// if err := tw.DeleteTaskInTaskwarrior(email, encryptionSecret, uuid, taskuuid); err != nil {
		// 	http.Error(w, err.Error(), http.StatusInternalServerError)
		// 	return
		// }
		job := Job{
			Name: "Delete Task",
			Execute: func() error {
				return tw.DeleteTaskInTaskwarrior(email, encryptionSecret, uuid, taskuuid)
			},
		}
		GlobalJobQueue.AddJob(job)
		w.WriteHeader(http.StatusAccepted)
		return
	}
	http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
}
