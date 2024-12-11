package tw

import (
	"ccsync_backend/models"
	"fmt"
	"os"
	"os/exec"
)

// complete logic (delete config if any->setup config->sync->get tasks->export)
func FetchTasksFromTaskwarrior(email, encryptionSecret, origin, UUID string) ([]models.Task, error) {
	// temporary directory for each user
	cmd := exec.Command("rm", "-rf", "/root/.task")
	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("error deleting Taskwarrior data: %v", err)
	}

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
	}
	return tasks, nil
}
