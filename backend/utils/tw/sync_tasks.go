package tw

import (
	"ccsync_backend/utils"
	"fmt"
)

// sync the user's tasks to all of their TW clients
func SyncTaskwarrior(tempDir string) error {
	if err := utils.ExecCommandInDir(tempDir, "task", "sync"); err != nil {
		return fmt.Errorf("error syncing Taskwarrior: %v", err)
	}
	return nil
}
