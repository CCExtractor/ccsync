package controllers

import (
	"ccsync_backend/models"
	"ccsync_backend/utils/tw"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

var GlobalJobQueue *JobQueue

func isValidRecurrencePattern(pattern string) bool {
	validPatterns := []string{"daily", "weekly", "monthly", "yearly"}
	for _, valid := range validPatterns {
		if pattern == valid {
			return true
		}
	}
	return false
}

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
		tags := requestBody.Tags
		recur := requestBody.Recur
		until := requestBody.Until

		if description == "" {
			http.Error(w, "Description is required, and cannot be empty!", http.StatusBadRequest)
			return
		}
		if dueDate == "" {
			http.Error(w, "Due Date is required, and cannot be empty!", http.StatusBadRequest)
			return
		}

		// Validate recurrence
		if recur != nil && *recur != "" {
			if !isValidRecurrencePattern(*recur) {
				http.Error(w, "Invalid recurrence pattern. Valid options are: daily, weekly, monthly, yearly", http.StatusBadRequest)
				return
			}
		}

		job := Job{
			Name: "Add Task",
			Execute: func() error {
				return tw.AddTaskToTaskwarrior(email, encryptionSecret, uuid, description, project, priority, dueDate, tags, recur, until)
			},
		}
		GlobalJobQueue.AddJob(job)
		w.WriteHeader(http.StatusAccepted)
		return
	}
	http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
}
