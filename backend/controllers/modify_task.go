package controllers

import (
	"ccsync_backend/models"
	"ccsync_backend/utils/tw"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// ModifyTaskHandler godoc
// @Summary Modify a task
// @Description Modify task properties including description, project, priority, status, due date, and tags
// @Tags Tasks
// @Accept json
// @Produce json
// @Param task body models.ModifyTaskRequestBody true "Task modification details"
// @Success 202 {string} string "Task modification accepted for processing"
// @Failure 400 {string} string "Bad request - invalid input or missing required fields"
// @Failure 405 {string} string "Method not allowed"
// @Router /modify-task [post]
func ModifyTaskHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		body, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, fmt.Sprintf("error reading request body: %v", err), http.StatusBadRequest)
			return
		}
		defer r.Body.Close()

		// fmt.Printf("Raw request body: %s\n", string(body))

		var requestBody models.ModifyTaskRequestBody

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
		project := requestBody.Project
		priority := requestBody.Priority
		status := requestBody.Status
		due := requestBody.Due
		start := requestBody.Start
		end := requestBody.End
		tags := requestBody.Tags

		if description == "" {
			http.Error(w, "Description is required, and cannot be empty!", http.StatusBadRequest)
			return
		}
		if taskID == "" {
			http.Error(w, "taskID is required", http.StatusBadRequest)
			return
		}

		// Validate start/end ordering if provided
		if err := validateStartEnd(start, end); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		// requestBody currently doesn't include start field for ModifyTaskRequestBody

		// if err := tw.ModifyTaskInTaskwarrior(uuid, description, project, priority, status, due, email, encryptionSecret, taskID); err != nil {
		// 	http.Error(w, err.Error(), http.StatusInternalServerError)
		// 	return
		// }

		logStore := models.GetLogStore()
		job := Job{
			Name: "Modify Task",
			Execute: func() error {
				logStore.AddLog("INFO", fmt.Sprintf("Modifying task ID: %s", taskID), uuid, "Modify Task")
				err := tw.ModifyTaskInTaskwarrior(uuid, description, project, priority, status, due, end, email, encryptionSecret, taskID, tags)
				if err != nil {
					logStore.AddLog("ERROR", fmt.Sprintf("Failed to modify task ID %s: %v", taskID, err), uuid, "Modify Task")
					return err
				}
				logStore.AddLog("INFO", fmt.Sprintf("Successfully modified task ID: %s", taskID), uuid, "Modify Task")
				return nil
			},
		}
		GlobalJobQueue.AddJob(job)
		w.WriteHeader(http.StatusAccepted)
		return
	}
	http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
}
