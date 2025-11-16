package tw

import (
	"ccsync_backend/utils"
	"fmt"
	"os"
	"strings"
)

// add task to the user's tw client
func AddTaskToTaskwarrior(email, encryptionSecret, uuid, description, project, priority, dueDate, start string, tags []string) error {
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
	if start != "" {
		cmdArgs = append(cmdArgs, "scheduled:"+start)
	}
	// Add tags to the task
	if len(tags) > 0 {
		for _, tag := range tags {
			if tag != "" {
				// Ensure tag doesn't contain spaces
				cleanTag := strings.ReplaceAll(tag, " ", "_")
				cmdArgs = append(cmdArgs, "+"+cleanTag)
			}
		}
	}

	if err := utils.ExecCommandInDir(tempDir, "task", cmdArgs...); err != nil {
		return fmt.Errorf("failed to add task: %v\n %v", err, cmdArgs)
	}

	// Sync Taskwarrior again
	if err := SyncTaskwarrior(tempDir); err != nil {
		return err
	}

	return nil
}
