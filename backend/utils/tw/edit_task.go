package tw

import (
	"ccsync_backend/utils"
	"fmt"
	"os"
)

func EditTaskInTaskwarrior(uuid, description, email, encryptionSecret, taskID string) error {
	if err := utils.ExecCommand("rm", "-rf", "/root/.task"); err != nil {
		return fmt.Errorf("error deleting Taskwarrior data: %v", err)
	}
	tempDir, err := os.MkdirTemp("", "taskwarrior-"+email)
	if err != nil {
		fmt.Println("Log1")
		return fmt.Errorf("failed to create temporary directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	origin := os.Getenv("CONTAINER_ORIGIN")
	if err := SetTaskwarriorConfig(tempDir, encryptionSecret, origin, uuid); err != nil {
		fmt.Println("Log2")
		return err
	}

	if err := SyncTaskwarrior(tempDir); err != nil {
		fmt.Println("Log3")
		return err
	}

	// Escape the double quotes in the description and format it
	if err := utils.ExecCommand("task", taskID, "modify", description); err != nil {
		fmt.Println("task " + taskID + " modify " + description)
		fmt.Println("Log4")
		return fmt.Errorf("failed to edit task: %v", err)
	}

	// Sync Taskwarrior again
	if err := SyncTaskwarrior(tempDir); err != nil {
		fmt.Println("Log5")
		return err
	}
	return nil
}
