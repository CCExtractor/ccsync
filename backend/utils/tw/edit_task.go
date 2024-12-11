package tw

import (
	"ccsync_backend/utils"
	"fmt"
	"os"
	"strings"
)

func EditTaskInTaskwarrior(uuid, description, email, encryptionSecret, taskuuid string) error {
	if err := utils.ExecCommand("rm", "-rf", "/root/.task"); err != nil {
		return fmt.Errorf("error deleting Taskwarrior data: %v", err)
	}
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

	if err := utils.ExecCommand("task", taskuuid, "modify", escapedDescription); err != nil {
		return fmt.Errorf("failed to edit task: %v", err)
	}

	// Sync Taskwarrior again
	if err := SyncTaskwarrior(tempDir); err != nil {
		return err
	}
	return nil
}
