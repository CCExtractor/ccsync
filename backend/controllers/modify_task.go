package controllers

import (
	"ccsync_backend/models"
	"ccsync_backend/utils/tw"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

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
		tags := requestBody.Tags

		if description == "" {
			http.Error(w, "Description is required, and cannot be empty!", http.StatusBadRequest)
			return
		}
		if taskID == "" {
			http.Error(w, "taskID is required", http.StatusBadRequest)
			return
		}

		// if err := tw.ModifyTaskInTaskwarrior(uuid, description, project, priority, status, due, email, encryptionSecret, taskID); err != nil {
		// 	http.Error(w, err.Error(), http.StatusInternalServerError)
		// 	return
		// }

		job := Job{
			Name: "Modify Task",
			Execute: func() error {
				return tw.ModifyTaskInTaskwarrior(uuid, description, project, priority, status, due, email, encryptionSecret, taskID, tags)
			},
		}
		GlobalJobQueue.AddJob(job)

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Task modification request received"))
	} else {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}
