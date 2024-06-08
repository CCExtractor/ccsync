package main

import (
	"encoding/json"
	"fmt"
	"net/http"
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

func addTaskHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		description := r.FormValue("description")
		if strings.TrimSpace(description) == "" {
			http.Error(w, "Description is required", http.StatusBadRequest)
			return
		}
		if err := addTaskToTaskwarrior(description); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		http.Redirect(w, r, "/tasks", http.StatusSeeOther)
		return
	}

	http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
}

func editTaskHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		uuid := r.FormValue("uuid")
		description := r.FormValue("description")
		if strings.TrimSpace(uuid) == "" || strings.TrimSpace(description) == "" {
			http.Error(w, "UUID and description are required", http.StatusBadRequest)
			return
		}
		if err := editTaskInTaskwarrior(uuid, description); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		http.Redirect(w, r, "/tasks", http.StatusSeeOther)
		return
	}

	http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
}

func completeTaskHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		uuid := r.FormValue("uuid")
		if strings.TrimSpace(uuid) == "" {
			http.Error(w, "UUID is required", http.StatusBadRequest)
			return
		}
		if err := completeTaskInTaskwarrior(uuid); err != nil {
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
		if err := syncTasksWithTaskwarrior(); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		http.Redirect(w, r, "/tasks", http.StatusSeeOther)
		return
	}

	http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
}

func fetchTasksFromTaskwarrior(email, encryptionSecret, origin, UUID string) []Task {
	// Delete .taskrc file before parsing tasks
	cmd := exec.Command("rm", "/root/.taskrc")
	if err := cmd.Run(); err != nil {
		fmt.Printf("\nerror in deleting .taskrc - it doesnot exist %v\n", err)
	} else {
		fmt.Printf("\nDeleted .taskrc \n")
	}

	// Set Taskwarrior configuration for the user
	configCmds := [][]string{
		{"task", "config", "sync.encryption_secret", encryptionSecret, "rc.confirmation=off"},
		{"task", "config", "sync.server.origin", origin, "rc.confirmation=off"},
		{"task", "config", "sync.server.client_id", UUID, "rc.confirmation=off"},
	}

	for _, args := range configCmds {
		cmd := exec.Command(args[0], args[1:]...)
		if err := cmd.Run(); err != nil {
			fmt.Printf("\nError setting Taskwarrior config (%v): %v\n", args, err)
			return nil
		} else {
			fmt.Printf("\nSyncing %v doing: %v\n", email, args)
		}
	}

	fmt.Print("\nConfig set successfully\n")

	// Initialize and sync Taskwarrior
	syncCmds := [][]string{
		{"task", "sync"},
	}

	for _, args := range syncCmds {
		cmd := exec.Command(args[0], args[1:]...)
		if err := cmd.Run(); err != nil {
			fmt.Printf("Error syncing Taskwarrior (%v): %v\n", args, err)
			return nil
		} else {
			fmt.Printf("\nSyncing %v doing: %v\n", email, args)
		}
	}

	// Export tasks from Taskwarrior
	cmd = exec.Command("task", "export")
	output, err := cmd.Output()
	if err != nil {
		fmt.Println("Error executing Taskwarrior export command:", err)
		return nil
	} else {
		fmt.Printf("\nSyncing %v doing: %v\n", email, "task export")
	}

	// Parse the exported tasks
	var tasks []Task
	if err := json.Unmarshal(output, &tasks); err != nil {
		fmt.Println("Error parsing tasks:", err)
		return nil
	}

	// Delete .taskrc file after parsing tasks
	cmd = exec.Command("rm", "/root/.taskrc")
	if err := cmd.Run(); err != nil {
		fmt.Printf("\nerror in deleting .taskrc %v\n", err)
		return nil
	} else {
		fmt.Printf("\nDeleted .taskrc \n")
	}

	return tasks
}

func addTaskToTaskwarrior(description string) error {
	cmd := exec.Command("task", "add", description)
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to add task: %v", err)
	}
	return nil
}

func editTaskInTaskwarrior(uuid, description string) error {
	cmd := exec.Command("task", uuid, "modify", description)
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to edit task: %v", err)
	}
	return nil
}

func completeTaskInTaskwarrior(uuid string) error {
	cmd := exec.Command("task", uuid, "done")
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to mark task as done: %v", err)
	}
	return nil
}

func syncTasksWithTaskwarrior() error {
	cmd := exec.Command("task", "sync")
	output, err := cmd.CombinedOutput()
	if err != nil {
		fmt.Printf("Error syncing tasks: %v, Output: %s\n", err, output)
		return fmt.Errorf("failed to sync tasks: %v, Output: %s", err, output)
	}
	return nil
}
