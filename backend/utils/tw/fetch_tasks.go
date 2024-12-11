package tw

import (
	"ccsync_backend/models"
	"ccsync_backend/utils"
	"fmt"
	"os"
)

// complete logic (delete config if any->setup config->sync->get tasks->export)
func FetchTasksFromTaskwarrior(email, encryptionSecret, origin, UUID string) ([]models.Task, error) {
	// temporary directory for each user
	if err := utils.ExecCommand("rm", "-rf", "/root/.task"); err != nil {
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
