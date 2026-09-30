package tw

import (
	"ccsync_backend/models"
	"ccsync_backend/utils"
	"fmt"
	"os"
)

func FetchTasksFromTaskwarrior(email, encryptionSecret, origin, UUID string) ([]models.Task, error) {
	taskwarriorMu.Lock()
	defer taskwarriorMu.Unlock()

	tempDir, err := os.MkdirTemp("", utils.SafeTempDirPrefix("taskwarrior-", email))
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
