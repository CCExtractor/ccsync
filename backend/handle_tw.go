package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"strings"

	"github.com/google/uuid"
)

// Task represents a Taskwarrior task
type Task struct {
	ID          int32    `json:"id"`
	Description string   `json:"description"`
	Project     string   `json:"project"`
	Tags        []string `json:"tags"`
	Status      string   `json:"status"`
	UUID        string   `json:"uuid"`
	Urgency     float32  `json:"urgency"`
	Priority    string   `json:"priority"`
	Due         string   `json:"due"`
	End         string   `json:"end"`
	Entry       string   `json:"entry"`
	Modified    string   `json:"modified"`
}

func GenerateUUID(email, id string) string {
	namespace := uuid.NewMD5(uuid.NameSpaceOID, []byte(email+id))
	return namespace.String()
}

func GenerateEncryptionSecret(uuidStr, email, id string) string {
	hash := sha256.New()
	hash.Write([]byte(uuidStr + email + id))
	return hex.EncodeToString(hash.Sum(nil))
}

func FetchTasksFromTaskwarrior(email, encryptionSecret, origin, UUID string) ([]Task, error) {
	// temporary directory for each user
	cmd := exec.Command("rm", "-rf", "/root/.task")
	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("error deleting Taskwarrior data: %v", err)
	}

	tempDir, err := os.MkdirTemp("", "taskwarrior-"+email)
	if err != nil {
		return nil, fmt.Errorf("failed to create temporary directory: %v", err)
	} else {
		fmt.Print("dir created successfully")
	}
	defer os.RemoveAll(tempDir)

	if err := SetTaskwarriorConfig(tempDir, encryptionSecret, origin, UUID); err != nil {
		return nil, err
	} else {
		fmt.Print("set config successfully")
	}

	if err := SyncTaskwarrior(tempDir); err != nil {
		return nil, err
	} else {
		fmt.Print("synced successfully")
	}

	tasks, err := ExportTasks(tempDir)
	if err != nil {
		return nil, err
	} else {
		fmt.Fprintln(os.Stdout, []any{"Synced tasks for ", email, tasks}...)
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

func AddTaskToTaskwarrior(email, encryptionSecret, uuid, description, project, priority, dueDate string) error {
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
	if dueDate != "" {
		cmdArgs = append(cmdArgs, "due:"+dueDate)
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

func EditTaskInTaskwarrior(uuid, description, email, encryptionSecret, taskuuid string) error {
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

	// Escape the double quotes in the description and format it
	escapedDescription := fmt.Sprintf(`description:"%s"`, strings.ReplaceAll(description, `"`, `\"`))

	cmd := exec.Command("task", taskuuid, "modify", escapedDescription)
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to edit task: %v", err)
	}

	// Sync Taskwarrior again
	if err := SyncTaskwarrior(tempDir); err != nil {
		return err
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
