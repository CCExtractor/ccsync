package tw

import (
	"fmt"
	"os/exec"
)

// sync the user's tasks to all of their TW clients
func SyncTaskwarrior(tempDir string) error {
	cmd := exec.Command("task", "sync")
	cmd.Dir = tempDir
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("error syncing Taskwarrior: %v", err)
	}
	return nil
}
