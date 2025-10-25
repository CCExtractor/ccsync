package controllers

import (
	"ccsync_backend/models"
	"ccsync_backend/utils/tw"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// EditTaskHandler godoc
// @Summary Edit a task
// @Description Edit task description and tags in Taskwarrior
// @Tags Tasks
// @Accept json
// @Produce json
// @Param task body models.EditTaskRequestBody true "Task edit details"
// @Success 202 {string} string "Task edit accepted for processing"
// @Failure 400 {string} string "Bad request - invalid input or missing taskID"
// @Failure 405 {string} string "Method not allowed"
// @Router /edit-task [post]
func EditTaskHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		body, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, fmt.Sprintf("error reading request body: %v", err), http.StatusBadRequest)
			return
		}
		defer r.Body.Close()

		// fmt.Printf("Raw request body: %s\n", string(body))

		var requestBody models.EditTaskRequestBody

		err = json.Unmarshal(body, &requestBody)
		if err != nil {
			http.Error(w, fmt.Sprintf("error decoding request body: %v", err), http.StatusBadRequest)
			return
		}

		email := requestBody.Email
		encryptionSecret := requestBody.EncryptionSecret
		uuid := requestBody.UUID
		taskID := requestBody.TaskID
		description := requestBody.Description
		tags := requestBody.Tags

		if taskID == "" {
			http.Error(w, "taskID is required", http.StatusBadRequest)
			return
		}

		// if err := tw.EditTaskInTaskwarrior(uuid, description, email, encryptionSecret, taskID); err != nil {
		// http.Error(w, err.Error(), http.StatusInternalServerError)
		// return
		// }

		job := Job{
			Name: "Edit Task",
			Execute: func() error {
				return tw.EditTaskInTaskwarrior(uuid, description, email, encryptionSecret, taskID, tags)
			},
		}
		GlobalJobQueue.AddJob(job)
		w.WriteHeader(http.StatusAccepted)

		return
	}
	http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
}
