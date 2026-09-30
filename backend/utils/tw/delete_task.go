package tw

import (
	"ccsync_backend/utils"
	"fmt"
	"os"
)

func DeleteTaskInTaskwarrior(email, encryptionSecret, uuid, taskuuid string) error {
	taskwarriorMu.Lock()
	defer taskwarriorMu.Unlock()

	tempDir, err := os.MkdirTemp("", utils.SafeTempDirPrefix("taskwarrior-", email))
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

	if err := utils.ExecTaskInDir(tempDir, taskuuid, "delete", "rc.confirmation=off"); err != nil {
		return fmt.Errorf("failed to mark task as deleted: %v", err)
	}

	// Sync Taskwarrior again
	if err := SyncTaskwarrior(tempDir); err != nil {
		return err
	}

	return nil
}
