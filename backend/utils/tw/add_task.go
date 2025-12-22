package tw

import (
	"ccsync_backend/models"
	"ccsync_backend/utils"
	"encoding/json"
	"fmt"
	"os"
	"strings"
)

// add task to the user's tw client
func AddTaskToTaskwarrior(email, encryptionSecret, uuid, description, project, priority, dueDate, start, end, recur string, tags []string, annotations []models.Annotation) error {
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
		cmdArgs = append(cmdArgs, "start:"+start)
	}
	if end != "" {
		cmdArgs = append(cmdArgs, "end:"+end)
	}
	// Note: Taskwarrior requires a due date to be set before recur can be set
	// Only add recur if dueDate is also provided
	if recur != "" && dueDate != "" {
		cmdArgs = append(cmdArgs, "recur:"+recur)
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

	if len(annotations) > 0 {
		output, err := utils.ExecCommandForOutputInDir(tempDir, "task", "export")
		if err != nil {
			return fmt.Errorf("failed to export tasks: %v", err)
		}

		var tasks []models.Task
		if err := json.Unmarshal(output, &tasks); err != nil {
			return fmt.Errorf("failed to parse exported tasks: %v", err)
		}

		if len(tasks) == 0 {
			return fmt.Errorf("no tasks found after creation")
		}

		lastTask := tasks[len(tasks)-1]
		taskID := fmt.Sprintf("%d", lastTask.ID)

		for _, annotation := range annotations {
			if annotation.Description != "" {
				annotateArgs := []string{"rc.confirmation=off", taskID, "annotate", annotation.Description}
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
