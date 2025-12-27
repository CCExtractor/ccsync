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
		w.WriteHeader(http.StatusAccepted)
		return
	}
	http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
}
func TogglePinHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method; POST required", http.StatusMethodNotAllowed)
		return
	}

	var payload struct {
		Email            string `json:"email"`
		EncryptionSecret string `json:"encryptionSecret"`
		UserUUID         string `json:"UUID"`
		TaskUUID         string `json:"taskuuid"`
		TaskID           string `json:"taskid"`
		IsPinned         *bool  `json:"isPinned"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, fmt.Sprintf("invalid JSON: %v", err), http.StatusBadRequest)
		return
	}

	taskUUID := payload.TaskUUID
	if taskUUID == "" {
		taskUUID = payload.TaskID
	}

	if taskUUID == "" {
		http.Error(w, "missing task identifier (taskuuid/taskid)", http.StatusBadRequest)
		return
	}
	if payload.Email == "" || payload.EncryptionSecret == "" || payload.UserUUID == "" {
		http.Error(w, "missing email, encryptionSecret or UUID", http.StatusBadRequest)
		return
	}

	isPinned := false
	if payload.IsPinned != nil {
		isPinned = *payload.IsPinned
	}

	if err := ModifyTaskPinStatus(payload.Email, payload.EncryptionSecret, payload.UserUUID, taskUUID, isPinned); err != nil {
		fmt.Printf("TogglePinHandler error: %v\n", err)
		http.Error(w, fmt.Sprintf("failed to update pin: %v", err), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
func ModifyTaskPinStatus(email, encryptionSecret, userUUID, taskUUID string, isPinned bool) error {
	return tw.ModifyTaskPin(email, encryptionSecret, userUUID, taskUUID, isPinned)
}

