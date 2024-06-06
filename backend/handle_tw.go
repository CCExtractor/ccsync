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

// func main() {
// 	http.HandleFunc("/tasks", tasksHandler)
// 	http.HandleFunc("/add-task", addTaskHandler)
// 	http.HandleFunc("/edit-task", editTaskHandler)
// 	http.HandleFunc("/complete-task", completeTaskHandler)
// 	http.HandleFunc("/sync-tasks", syncTasksHandler)

// 	fmt.Println("Server is running on port 8080")
// 	if err := http.ListenAndServe(":8080", nil); err != nil {
// 		fmt.Println("Server failed:", err)
// 	}
// }

// commented out code for usage in case of independent uses

// func tasksHandler(w http.ResponseWriter, r *http.Request) {
// 	email := a.UserEmail
// 	encryptionSecret := a.EncryptionSecret
// 	origin := "" // Set origin from config or session
// 	clientID := a.ClientID
// 	if r.Method == http.MethodGet {
// 		tasks := fetchTasksFromTaskwarrior(email, encryptionSecret, origin, clientID)
// 		if tasks == nil {
// 			http.Error(w, "Failed to fetch tasks", http.StatusInternalServerError)
// 			return
// 		}
// 		w.Header().Set("Content-Type", "application/json")
// 		json.NewEncoder(w).Encode(tasks)
// 		return
// 	}

// 	http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
// }

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

// func fetchTasksFromTaskwarrior(email, encryptionSecret, origin, UUID string) []Task {
// 	// Set up Taskwarrior sync
// 	cmd := exec.Command("task", "config", "sync.encryption_secret", encryptionSecret)
// 	if err := cmd.Run(); err != nil {
// 		fmt.Println("Error setting up Taskwarrior sync (encryption_secret):", err)
// 		return nil
// 	} else {
// 		cmd = exec.Command("yes")
// 		if err := cmd.Run(); err != nil {
// 			fmt.Println("Set encryption_secret unsuccessful", err)
// 			return nil
// 		}
// 		fmt.Println("Successfully set up Taskwarrior sync (encryption_secret):", encryptionSecret)
// 	}

// 	// Set origin
// 	cmd = exec.Command("task", "config", "sync.server.origin", origin)
// 	if err := cmd.Run(); err != nil {
// 		fmt.Println("Error setting up Taskwarrior sync (origin):", err)
// 		return nil
// 	} else {
// 		cmd = exec.Command("yes")
// 		if err := cmd.Run(); err != nil {
// 			fmt.Println("Set client_id unsuccessful", err)
// 			return nil
// 		}
// 		fmt.Println("Successfully set up Taskwarrior sync (origin):", origin)
// 	}

// 	// Set client ID
// 	cmd = exec.Command("task", "config", "sync.server.client_id", UUID)
// 	if err := cmd.Run(); err != nil {
// 		fmt.Println("Error setting up Taskwarrior sync (client_id):", err)
// 		return nil
// 	} else {
// 		cmd = exec.Command("yes")
// 		if err := cmd.Run(); err != nil {
// 			fmt.Println("Set client_id successful", err)
// 			return nil
// 		}
// 		fmt.Println("Successfully set up Taskwarrior sync (client_id):", UUID)
// 	}

// 	// Sync tasks
// 	cmd = exec.Command("task", "sync", "init")
// 	if err := cmd.Run(); err != nil {
// 		fmt.Println("Error setting up sync", err)
// 		return nil
// 	} else {
// 		fmt.Println("Sync setup successful")
// 	}

// 	cmd = exec.Command("task", "sync")
// 	if err := cmd.Run(); err != nil {
// 		fmt.Println("Error syncing", err)
// 		return nil
// 	} else {
// 		fmt.Println("Sync successful")
// 	}

// 	// Export tasks from Taskwarrior
// 	cmd = exec.Command("task", "export")
// 	output, err := cmd.Output()
// 	if err != nil {
// 		fmt.Println("Error executing Taskwarrior command:", err)
// 		return nil
// 	} else {
// 		fmt.Println("Successfully exported tasks")
// 	}

// 	var tasks []Task
// 	if err := json.Unmarshal(output, &tasks); err != nil {
// 		fmt.Println("Error parsing tasks:", err)
// 		return nil
// 	}

// 	// Delete taskrc to reset configuration
// 	if err := os.Remove(os.ExpandEnv("$HOME/.task/taskrc")); err != nil {
// 		fmt.Println("error deleting taskrc: ", err)
// 		return nil
// 	}

// 	return tasks
// }

// FOR LINUX
// func fetchTasksFromTaskwarrior(email, encryptionSecret, origin, UUID string) []Task {
// 	// // Create Linux user based on email
// 	// cmd := exec.Command("sudo", "adduser", "--disabled-password", email)
// 	// if err := cmd.Run(); err != nil {
// 	// 	fmt.Println("Error creating Linux user:", err)
// 	// 	return nil
// 	// }

// 	// Set Taskwarrior configuration for the user
// 	configCmds := [][]string{
// 		{"task", "config", "sync.encryption_secret", encryptionSecret},
// 		{"task", "config", "sync.server.origin", origin},
// 		{"task", "config", "sync.server.client_id", UUID},
// 	}

// 	for _, args := range configCmds {
// 		cmd := exec.Command(args[0], args[1:]...)
// 		if err := cmd.Run(); err != nil {
// 			fmt.Printf("Error setting Taskwarrior config (%v): %v\n", args, err)
// 			return nil
// 		}
// 	}

// 	// Initialize and sync Taskwarrior
// 	syncCmds := [][]string{
// 		{"task", "sync"},
// 	}

// 	for _, args := range syncCmds {
// 		cmd := exec.Command(args[0], args[1:]...)
// 		if err := cmd.Run(); err != nil {
// 			fmt.Printf("Error syncing Taskwarrior (%v): %v\n", args, err)
// 			return nil
// 		}
// 	}

// 	// Export tasks from Taskwarrior
// 	cmd := exec.Command("task", "export")
// 	output, err := cmd.Output()
// 	if err != nil {
// 		fmt.Println("Error executing Taskwarrior export command:", err)
// 		return nil
// 	}

// 	// Parse the exported tasks
// 	var tasks []Task
// 	if err := json.Unmarshal(output, &tasks); err != nil {
// 		fmt.Println("Error parsing tasks:", err)
// 		return nil
// 	}

// 	// Delete the user
// 	// cmd = exec.Command("sudo", "deluser", "--remove-home", email)
// 	// if err := cmd.Run(); err != nil {
// 	// 	fmt.Println("Error deleting Linux user:", err)
// 	// 	return nil
// 	// }

// 	return tasks
// }

func fetchTasksFromTaskwarrior(email, encryptionSecret, origin, UUID string) []Task {
	// Delete .taskrc file before parsing tasks
	cmd := exec.Command("rm", "/root/.taskrc")
	if err := cmd.Run(); err != nil {
		fmt.Printf("\nerror in deleting .taskrc - it doesnot exist %v\n", err)
	} else {
		fmt.Printf("\nDeleted .taskrc \n")
	}
	// if err := os.Remove("/root/.taskrc"); err != nil {
	// 	fmt.Println("Error deleting .taskrc file:", err)
	// } else {
	// 	fmt.Println("\n\n\n.taskrc file deleted successfully")
	// }

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

	// this function can not work on container probably
	// if err := os.Remove("/root/.taskrc"); err != nil {
	// 	fmt.Println("Error deleting .taskrc file:", err)
	// } else {
	// 	fmt.Println("\n\n\n.taskrc file deleted successfully")
	// }
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
