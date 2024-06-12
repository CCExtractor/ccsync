package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"strings"
)

// Task represents a Taskwarrior task
type Task struct {
	ID          int32   `json:"id"`
	Description string  `json:"description"`
	Project     string  `json:"project"`
	Tag         string  `json:"tag"`
	Status      string  `json:"status"`
	UUID        string  `json:"uuid"`
	Urgency     float32 `json:"urgency"`
	Priority    string  `json:"priority"`
	Due         string  `json:"due"`
	End         string  `json:"end"`
	Entry       string  `json:"entry"`
	Modified    string  `json:"modified"`
}

func editTaskHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		uuid := r.FormValue("uuid")
		description := r.FormValue("description")
		if strings.TrimSpace(uuid) == "" || strings.TrimSpace(description) == "" {
			http.Error(w, "UUID and description are required", http.StatusBadRequest)
			return
		}
		if err := EditTaskInTaskwarrior(uuid, description); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		http.Redirect(w, r, "/tasks", http.StatusSeeOther)
		return
	}

	http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
}

func syncTasksHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		if err := SyncTasksWithTaskwarrior(); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		http.Redirect(w, r, "/tasks", http.StatusSeeOther)
		return
	}

	http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
}

func fetchTasksFromTaskwarrior(email, encryptionSecret, origin, UUID string) ([]Task, error) {
	// temporary directory for each user
	tempDir, err := os.MkdirTemp("", "taskwarrior-"+email)
	if err != nil {
		return nil, fmt.Errorf("failed to create temporary directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	if err := SetTaskwarriorConfig(tempDir, encryptionSecret, origin, UUID); err != nil {
		return nil, err
	}

	if err := SyncTaskwarrior(tempDir); err != nil {
		return nil, err
	}

	tasks, err := ExportTasks(tempDir)
	if err != nil {
		return nil, err
	} else {
		fmt.Fprintln(os.Stdout, []any{"Synced tasks for ", email}...)
	}

	return tasks, nil
}

func SetTaskwarriorConfig(tempDir, encryptionSecret, origin, UUID string) error {
	configCmds := [][]string{
		{"task", "config", "sync.encryption_secret", encryptionSecret, "rc.confirmation=off"},
		{"task", "config", "sync.server.origin", origin, "rc.confirmation=off"},
		{"task", "config", "sync.server.client_id", UUID, "rc.confirmation=off"},
	}
	for _, args := range configCmds {
		cmd := exec.Command(args[0], args[1:]...)
		cmd.Dir = tempDir
		if err := cmd.Run(); err != nil {
			return fmt.Errorf("error setting Taskwarrior config (%v): %v", args, err)
		}
	}
	return nil
}

func SyncTaskwarrior(tempDir string) error {
	cmd := exec.Command("task", "sync")
	cmd.Dir = tempDir
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("error syncing Taskwarrior: %v", err)
	}
	return nil
}

func ExportTasks(tempDir string) ([]Task, error) {
	cmd := exec.Command("task", "export")
	cmd.Dir = tempDir
	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("error executing Taskwarrior export command: %v", err)
	}

	// Parse the exported tasks
	var tasks []Task
	if err := json.Unmarshal(output, &tasks); err != nil {
		return nil, fmt.Errorf("error parsing tasks: %v", err)
	}

	return tasks, nil
}

func AddTaskToTaskwarrior(email, encryptionSecret, uuid, description, project, priority string) error {
	tempDir, err := os.MkdirTemp("", "taskwarrior-"+email)
	if err != nil {
		return fmt.Errorf("failed to create temporary directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	origin := os.Getenv("CONTAINER_ORIGIN")
	if err := SetTaskwarriorConfig(tempDir, encryptionSecret, origin, uuid); err != nil {
		return err
	}

	if err := SyncTaskwarrior(tempDir); err != nil {
		return err
	}

	cmdArgs := []string{"add", description}
	if project != "" {
		cmdArgs = append(cmdArgs, "project:"+project)
	}
	if priority != "" {
		cmdArgs = append(cmdArgs, "priority:"+priority)
	}

	cmd := exec.Command("task", cmdArgs...)
	cmd.Dir = tempDir
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to add task: %v", err)
	}

	// Sync Taskwarrior again
	if err := SyncTaskwarrior(tempDir); err != nil {
		return err
	}

	return nil
}

func EditTaskInTaskwarrior(uuid, description string) error {
	cmd := exec.Command("task", uuid, "modify", description)
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to edit task: %v", err)
	}
	return nil
}

func DeleteTaskInTaskwarrior(email, encryptionSecret, uuid, taskuuid string) error {
	tempDir, err := os.MkdirTemp("", "taskwarrior-"+email)
	if err != nil {
		return fmt.Errorf("failed to create temporary directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	origin := os.Getenv("CONTAINER_ORIGIN")
	if err := SetTaskwarriorConfig(tempDir, encryptionSecret, origin, uuid); err != nil {
		return err
	}

	if err := SyncTaskwarrior(tempDir); err != nil {
		return err
	}

	// Mark the task as deleted
	cmd := exec.Command("task", taskuuid, "delete", "rc.confirmation=off")
	cmd.Dir = tempDir
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to mark task as deleted: %v", err)
	}

	// Sync Taskwarrior again
	if err := SyncTaskwarrior(tempDir); err != nil {
		return err
	}

	return nil
}

func CompleteTaskInTaskwarrior(email, encryptionSecret, uuid, taskuuid string) error {
	tempDir, err := os.MkdirTemp("", "taskwarrior-"+email)
	if err != nil {
		return fmt.Errorf("failed to create temporary directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	origin := os.Getenv("CONTAINER_ORIGIN")
	if err := SetTaskwarriorConfig(tempDir, encryptionSecret, origin, uuid); err != nil {
		return err
	}

	if err := SyncTaskwarrior(tempDir); err != nil {
		return err
	}

	// Mark the task as done
	cmd := exec.Command("task", taskuuid, "done", "rc.confirmation=off")
	cmd.Dir = tempDir
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to mark task as done: %v", err)
	}

	// Sync Taskwarrior again
	if err := SyncTaskwarrior(tempDir); err != nil {
		return err
	}

	return nil
}

func SyncTasksWithTaskwarrior() error {
	cmd := exec.Command("task", "sync")
	output, err := cmd.CombinedOutput()
	if err != nil {
		fmt.Printf("Error syncing tasks: %v, Output: %s\n", err, output)
		return fmt.Errorf("failed to sync tasks: %v, Output: %s", err, output)
	}
	return nil
}
