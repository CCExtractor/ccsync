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
		taskUUID := requestBody.TaskUUID
		description := requestBody.Description
		tags := requestBody.Tags
		project := requestBody.Project
		start := requestBody.Start
		entry := requestBody.Entry
		wait := requestBody.Wait
		end := requestBody.End
		depends := requestBody.Depends
		due := requestBody.Due
		recur := requestBody.Recur
		annotations := requestBody.Annotations

		if taskUUID == "" {
			http.Error(w, "taskID is required", http.StatusBadRequest)
			return
		}

		// Validate dependencies
		origin := os.Getenv("CONTAINER_ORIGIN")
		existingTasks, err := tw.FetchTasksFromTaskwarrior(email, encryptionSecret, origin, uuid)
		if err != nil {
			if err := utils.ValidateDependencies(depends, taskUUID); err != nil {
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

			if err := utils.ValidateCircularDependencies(depends, taskUUID, taskDeps); err != nil {
				http.Error(w, fmt.Sprintf("Invalid dependencies: %v", err), http.StatusBadRequest)
				return
			}
		}

		start, err = utils.ConvertISOToTaskwarriorFormat(start)
		if err != nil {
			http.Error(w, fmt.Sprintf("Invalid start date format: %v", err), http.StatusBadRequest)
			return
		}

		due, err = utils.ConvertISOToTaskwarriorFormat(due)
		if err != nil {
			http.Error(w, fmt.Sprintf("Invalid due date format: %v", err), http.StatusBadRequest)
			return
		}

		end, err = utils.ConvertISOToTaskwarriorFormat(end)
		if err != nil {
			http.Error(w, fmt.Sprintf("Invalid end date format: %v", err), http.StatusBadRequest)
			return
		}

		entry, err = utils.ConvertISOToTaskwarriorFormat(entry)
		if err != nil {
			http.Error(w, fmt.Sprintf("Invalid entry date format: %v", err), http.StatusBadRequest)
			return
		}

		wait, err = utils.ConvertISOToTaskwarriorFormat(wait)
		if err != nil {
			http.Error(w, fmt.Sprintf("Invalid wait date format: %v", err), http.StatusBadRequest)
			return
		}

		logStore := models.GetLogStore()
		job := Job{
			Name: "Edit Task",
			Execute: func() error {
				logStore.AddLog(
					"INFO",
					fmt.Sprintf("Editing task ID: %s", taskUUID),
					uuid,
					"Edit Task",
				)

				req := models.EditTaskRequestBody{
					UUID:             uuid,
					Email:            email,
					EncryptionSecret: encryptionSecret,
					TaskUUID:         taskUUID,
					Description:      description,
					Project:          project,
					Start:            start,
					Entry:            entry,
					Wait:             wait,
					End:              end,
					Depends:          depends,
					Due:              due,
					Recur:            recur,
					Tags:             tags,
					Annotations:      annotations,
				}

				err := tw.EditTaskInTaskwarrior(req)
				if err != nil {
					logStore.AddLog(
						"ERROR",
						fmt.Sprintf("Failed to edit task ID %s: %v", taskUUID, err),
						uuid,
						"Edit Task",
					)
					return err
				}

				logStore.AddLog(
					"INFO",
					fmt.Sprintf("Successfully edited task ID: %s", taskUUID),
					uuid,
					"Edit Task",
				)
				return nil
			},
		}

		GlobalJobQueue.AddJob(job)
		w.WriteHeader(http.StatusAccepted)

		return
	}
	http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
}
