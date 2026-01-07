package controllers

import (
	"ccsync_backend/models"
	"ccsync_backend/utils"
	"ccsync_backend/utils/tw"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
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
		var requestBody models.AddTaskRequestBody
		if err := json.NewDecoder(r.Body).Decode(&requestBody); err != nil {
			http.Error(w, fmt.Sprintf("error decoding request body: %v", err), http.StatusBadRequest)
			return
		}
		defer r.Body.Close()

		if requestBody.Description == "" {
			http.Error(w, "Description is required, and cannot be empty!", http.StatusBadRequest)
			return
		}

		if len(requestBody.Depends) > 0 {
			origin := os.Getenv("CONTAINER_ORIGIN")
			existingTasks, err := tw.FetchTasksFromTaskwarrior(requestBody.Email, requestBody.EncryptionSecret, origin, requestBody.UUID)
			if err != nil {
				if err := utils.ValidateDependencies(requestBody.Depends, ""); err != nil {
					http.Error(w, fmt.Sprintf("Invalid dependencies: %v", err), http.StatusBadRequest)
					return
				}
			} else {
				taskDeps := make([]utils.TaskDependency, len(existingTasks))
				for i, task := range existingTasks {
					taskDeps[i] = utils.TaskDependency{
						UUID:    task.UUID,
						Depends: task.Depends,
						Status:  task.Status,
					}
				}

				if err := utils.ValidateCircularDependencies(requestBody.Depends, "", taskDeps); err != nil {
					http.Error(w, fmt.Sprintf("Invalid dependencies: %v", err), http.StatusBadRequest)
					return
				}
			}
		}

		dueDateStr, err := utils.ConvertOptionalISOToTaskwarriorFormat(requestBody.DueDate)
		if err != nil {
			http.Error(w, fmt.Sprintf("Invalid due date format: %v", err), http.StatusBadRequest)
			return
		}

		logStore := models.GetLogStore()
		job := Job{
			Name: "Add Task",
			Execute: func() error {
				logStore.AddLog("INFO", fmt.Sprintf("Adding task: %s", requestBody.Description), requestBody.UUID, "Add Task")
				err := tw.AddTaskToTaskwarrior(requestBody, dueDateStr)
				if err != nil {
					logStore.AddLog("ERROR", fmt.Sprintf("Failed to add task: %v", err), requestBody.UUID, "Add Task")
					return err
				}
				logStore.AddLog("INFO", fmt.Sprintf("Successfully added task: %s", requestBody.Description), requestBody.UUID, "Add Task")
				return nil
			},
		}
		GlobalJobQueue.AddJob(job)
		w.WriteHeader(http.StatusAccepted)
		return
	}
	http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
}
