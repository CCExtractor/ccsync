package controllers

import (
	"ccsync_backend/models"
	"ccsync_backend/utils"
	"ccsync_backend/utils/tw"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
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
		taskUUID := requestBody.TaskUUID
		description := requestBody.Description
		project := requestBody.Project
		priority := requestBody.Priority
		status := requestBody.Status
		due := requestBody.Due
		tags := requestBody.Tags
		depends := requestBody.Depends

		if description == "" {
			http.Error(w, "Description is required, and cannot be empty!", http.StatusBadRequest)
			return
		}
		if taskUUID == "" {
			http.Error(w, "taskUUID is required", http.StatusBadRequest)
			return
		}

		// Validate dependencies
		origin := os.Getenv("CONTAINER_ORIGIN")
		existingTasks, err := tw.FetchTasksFromTaskwarrior(email, encryptionSecret, origin, uuid)
		if err != nil {
			if err := utils.ValidateDependencies(depends, uuid); err != nil {
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

			if err := utils.ValidateCircularDependencies(depends, uuid, taskDeps); err != nil {
				http.Error(w, fmt.Sprintf("Invalid dependencies: %v", err), http.StatusBadRequest)
				return
			}
		}

		// if err := tw.ModifyTaskInTaskwarrior(uuid, description, project, priority, status, due, email, encryptionSecret, taskID); err != nil {
		// 	http.Error(w, err.Error(), http.StatusInternalServerError)
		// 	return
		// }

		logStore := models.GetLogStore()
		job := Job{
			Name: "Modify Task",
			Execute: func() error {
				logStore.AddLog("INFO", fmt.Sprintf("Modifying task UUID: %s", taskUUID), uuid, "Modify Task")
				err := tw.ModifyTaskInTaskwarrior(uuid, description, project, priority, status, due, email, encryptionSecret, taskUUID, tags, depends)
				if err != nil {
					logStore.AddLog("ERROR", fmt.Sprintf("Failed to modify task UUID %s: %v", taskUUID, err), uuid, "Modify Task")
					return err
				}
				logStore.AddLog("INFO", fmt.Sprintf("Successfully modified task UUID: %s", taskUUID), uuid, "Modify Task")
				return nil
			},
		}
		GlobalJobQueue.AddJob(job)
		w.WriteHeader(http.StatusAccepted)
		return
	}
	http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
}
