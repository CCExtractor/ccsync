package tw

import (
	"ccsync_backend/models"
	"ccsync_backend/utils"
	"fmt"
	"os"
	"strings"
)

// add task to the user's tw client
func AddTaskToTaskwarrior(email, encryptionSecret, uuid, description, project, priority, dueDate string, tags []string, annotations []models.Annotation) error {
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

	// Add annotations to the newly created task
	if len(annotations) > 0 {
		// Get the ID of the last created task
		output, err := utils.ExecCommandForOutputInDir(tempDir, "task", "rc.verbose=nothing", "rc.report.next.columns=id", "rc.report.next.labels=ID", "limit:1", "next")
		if err != nil {
			return fmt.Errorf("failed to get task ID: %v", err)
		}

		// Extract task ID from output
		lines := strings.Split(strings.TrimSpace(string(output)), "\n")
		if len(lines) < 2 {
			return fmt.Errorf("could not find task ID in output")
		}

		taskID := strings.TrimSpace(lines[1])
		if taskID == "" {
			return fmt.Errorf("empty task ID")
		}

		for _, annotation := range annotations {
			if annotation.Description != "" {
				annotateArgs := []string{"rc.confirmation=off", "rc.bulk=0", "rc.verbose=nothing", "rc.hooks=off", taskID, "annotate", annotation.Description}
				if err := utils.ExecCommandInDir(tempDir, "task", annotateArgs...); err != nil {
					return fmt.Errorf("failed to add annotation to task %s: %v", taskID, err)
				}
			}
		}
	}

	// Sync Taskwarrior again
	if err := SyncTaskwarrior(tempDir); err != nil {
		return err
	}

	return nil
}
