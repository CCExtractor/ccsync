package tw

import (
	"ccsync_backend/models"
	"ccsync_backend/utils"
	"encoding/json"
	"fmt"
	"os"
	"strings"
)

func AddTaskToTaskwarrior(req models.AddTaskRequestBody, dueDate string) error {
	if err := utils.ExecCommand("rm", "-rf", "/root/.task"); err != nil {
		return fmt.Errorf("error deleting Taskwarrior data: %v", err)
	}

	tempDir, err := os.MkdirTemp("", "taskwarrior-"+req.Email)
	if err != nil {
		return fmt.Errorf("failed to create temporary directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	origin := os.Getenv("CONTAINER_ORIGIN")
	if err := SetTaskwarriorConfig(tempDir, req.EncryptionSecret, origin, req.UUID); err != nil {
		return err
	}

	if err := SyncTaskwarrior(tempDir); err != nil {
		return err
	}

	cmdArgs := []string{"add", req.Description}
	if req.Project != "" {
		cmdArgs = append(cmdArgs, "project:"+req.Project)
	}
	if req.Priority != "" {
		cmdArgs = append(cmdArgs, "priority:"+req.Priority)
	}
	if dueDate != "" {
		cmdArgs = append(cmdArgs, "due:"+dueDate)
	}
	if req.Start != "" {
		start, err := utils.ConvertISOToTaskwarriorFormat(req.Start)
		if err != nil {
			return fmt.Errorf("unexpected date format error: %v", err)
		}
		cmdArgs = append(cmdArgs, "start:"+start)
	}
	if len(req.Depends) > 0 {
		dependsStr := strings.Join(req.Depends, ",")
		cmdArgs = append(cmdArgs, "depends:"+dependsStr)
	}
	if req.EntryDate != "" {
		entry, err := utils.ConvertISOToTaskwarriorFormat(req.EntryDate)
		if err != nil {
			return fmt.Errorf("unexpected date format error: %v", err)
		}
		cmdArgs = append(cmdArgs, "entry:"+entry)
	}
	if req.WaitDate != "" {
		wait, err := utils.ConvertISOToTaskwarriorFormat(req.WaitDate)
		if err != nil {
			return fmt.Errorf("unexpected date format error: %v", err)
		}
		cmdArgs = append(cmdArgs, "wait:"+wait)
	}
	if req.End != "" {
		cmdArgs = append(cmdArgs, "end:"+req.End)
	}
	if req.Recur != "" && dueDate != "" {
		cmdArgs = append(cmdArgs, "recur:"+req.Recur)
	}
	if len(req.Tags) > 0 {
		for _, tag := range req.Tags {
			if tag != "" {
				cleanTag := strings.ReplaceAll(tag, " ", "_")
				cmdArgs = append(cmdArgs, "+"+cleanTag)
			}
		}
	}

	if err := utils.ExecCommandInDir(tempDir, "task", cmdArgs...); err != nil {
		return fmt.Errorf("failed to add task: %v\n %v", err, cmdArgs)
	}

	if len(req.Annotations) > 0 {
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

		for _, annotation := range req.Annotations {
			if annotation.Description != "" {
				annotateArgs := []string{"rc.confirmation=off", taskID, "annotate", annotation.Description}
				if err := utils.ExecCommandInDir(tempDir, "task", annotateArgs...); err != nil {
					return fmt.Errorf("failed to add annotation to task %s: %v", taskID, err)
				}
			}
		}
	}

	if err := SyncTaskwarrior(tempDir); err != nil {
		return err
	}

	return nil
}
