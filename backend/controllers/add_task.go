package controllers

import (
	"ccsync_backend/models"
	"ccsync_backend/utils"
	"ccsync_backend/utils/tw"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

var GlobalJobQueue *JobQueue

// AddTaskHandler godoc
// @Summary Add a new task
// @Description Add a new task to Taskwarrior for a specific user
// @Tags Tasks
// @Accept json
// @Produce json
// @Param task body models.AddTaskRequestBody true "Task details"
// @Success 202 {string} string "Task accepted for processing"
// @Failure 400 {string} string "Bad request - invalid input or missing required fields"
// @Failure 405 {string} string "Method not allowed"
// @Router /add-task [post]
func AddTaskHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		body, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, fmt.Sprintf("error reading request body: %v", err), http.StatusBadRequest)
			return
		}
		defer r.Body.Close()
		// fmt.Printf("Raw request body: %s\n", string(body))

		var requestBody models.AddTaskRequestBody

		err = json.Unmarshal(body, &requestBody)
		if err != nil {
			http.Error(w, fmt.Sprintf("error decoding request body: %v", err), http.StatusBadRequest)
			return
		}
		email := requestBody.Email
		encryptionSecret := requestBody.EncryptionSecret
		uuid := requestBody.UUID
		description := requestBody.Description
		project := requestBody.Project
		priority := requestBody.Priority
		dueDate := requestBody.DueDate
		start := requestBody.Start
		tags := requestBody.Tags
		annotations := requestBody.Annotations
		depends := requestBody.Depends

		if description == "" {
			http.Error(w, "Description is required, and cannot be empty!", http.StatusBadRequest)
			return
		}

		// Validate dependencies
		if err := utils.ValidateDependencies(depends, ""); err != nil {
			http.Error(w, fmt.Sprintf("Invalid dependencies: %v", err), http.StatusBadRequest)
			return
		}
		var dueDateStr string
		if dueDate != nil && *dueDate != "" {
			dueDateStr = *dueDate
		}

		logStore := models.GetLogStore()
		job := Job{
			Name: "Add Task",
			Execute: func() error {
				logStore.AddLog("INFO", fmt.Sprintf("Adding task: %s", description), uuid, "Add Task")
				err := tw.AddTaskToTaskwarrior(email, encryptionSecret, uuid, description, project, priority, dueDateStr, start, tags, annotations, depends)
				if err != nil {
					logStore.AddLog("ERROR", fmt.Sprintf("Failed to add task: %v", err), uuid, "Add Task")
					return err
				}
				logStore.AddLog("INFO", fmt.Sprintf("Successfully added task: %s", description), uuid, "Add Task")
				return nil
			},
		}
		GlobalJobQueue.AddJob(job)
		w.WriteHeader(http.StatusAccepted)
		return
	}
	http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
}
