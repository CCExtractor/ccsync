package tw

import (
	"ccsync_backend/utils"
	"fmt"
	"os"
)

func DeleteTasksInTaskwarrior(email, encryptionSecret, uuid string, taskUUIDs []string) (map[string]string, error) {
	failedTasks := make(map[string]string)

	if err := utils.ExecCommand("rm", "-rf", "/root/.task"); err != nil {
		return nil, fmt.Errorf("error deleting Taskwarrior data: %v", err)
	}

	tempDir, err := os.MkdirTemp("", "taskwarrior-"+email)

	if err != nil {
		return nil, fmt.Errorf("failed to create temporary directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	origin := os.Getenv("CONTAINER_ORIGIN")
	if err := SetTaskwarriorConfig(tempDir, encryptionSecret, origin, uuid); err != nil {
		return nil, err
	}

	if err := SyncTaskwarrior(tempDir); err != nil {
		return nil, err
	}

	for _, taskuuid := range taskUUIDs {
		if err := utils.ExecCommandInDir(tempDir, "task", taskuuid, "delete", "rc.confirmation=off"); err != nil {
			failedTasks[taskuuid] = err.Error()
			continue
		}
	}

	// Sync Taskwarrior again
	if err := SyncTaskwarrior(tempDir); err != nil {
		return failedTasks, err
	}

	return failedTasks, nil
}
