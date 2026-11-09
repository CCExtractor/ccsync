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

// fetchTasksFromTaskwarrior is the Taskwarrior fetch used by TasksHandler.
// Tests override it to avoid requiring a live Taskwarrior installation.
var fetchTasksFromTaskwarrior = tw.FetchTasksFromTaskwarrior

// TasksHandler godoc
// @Summary Get all tasks
// @Description Fetch all tasks from Taskwarrior for a specific user via Headers
// @Tags Tasks
// @Accept json
// @Produce json
// @Param X-User-Email header string true "User email"
// @Param X-Encryption-Secret header string true "Encryption secret"
// @Param X-User-UUID header string true "User UUID"
// @Success 200 {array} models.Task "List of tasks"
// @Failure 400 {string} string "Missing required headers"
// @Failure 500 {string} string "Failed to fetch tasks at backend"
// @Router /tasks [get]
func TasksHandler(w http.ResponseWriter, r *http.Request) {
	// Extracting from Headers instead of Query Params
	email := r.Header.Get("X-User-Email")
	encryptionSecret := r.Header.Get("X-Encryption-Secret")
	UUID := r.Header.Get("X-User-UUID")

	origin := os.Getenv("CONTAINER_ORIGIN")

	if email == "" || encryptionSecret == "" || UUID == "" {
		http.Error(w, "Missing required security headers", http.StatusBadRequest)
		return
	}

	if r.Method == http.MethodGet {
		type fetchResult struct {
			tasks []models.Task
			err   error
		}
		// Buffer of 1 so the queue worker never blocks if the client disconnects
		// before the handler receives the result.
		resultCh := make(chan fetchResult, 1)

		job := Job{
			Name: "Get Tasks",
			Execute: func() (err error) {
				var tasks []models.Task
				defer func() {
					if rec := recover(); rec != nil {
						utils.Logger.Errorf("Get Tasks job panicked: %v", rec)
						err = fmt.Errorf("panic while fetching tasks: %v", rec)
					}
					resultCh <- fetchResult{tasks: tasks, err: err}
				}()
				tasks, err = fetchTasksFromTaskwarrior(email, encryptionSecret, origin, UUID)
				return err
			},
		}
		GlobalJobQueue.AddJob(job)

		select {
		case res := <-resultCh:
			if res.err != nil {
				utils.Logger.Errorf("Failed to fetch tasks: %v", res.err)
				http.Error(w, "Failed to fetch tasks at backend", http.StatusInternalServerError)
				return
			}
			tasks := res.tasks
			if tasks == nil {
				tasks = []models.Task{}
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(tasks)
			return
		case <-r.Context().Done():
			// Client disconnected; the job may still finish and send into resultCh.
			return
		}
	}

	http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
}
