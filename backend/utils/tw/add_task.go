package tw

import (
	"ccsync_backend/models"
	"ccsync_backend/utils"
	"fmt"
	"os"
	"strings"
)

func AddTaskToTaskwarrior(req models.AddTaskRequestBody, dueDate string) error {
	taskwarriorMu.Lock()
	defer taskwarriorMu.Unlock()

	tempDir, err := os.MkdirTemp("", utils.SafeTempDirPrefix("taskwarrior-", req.Email))
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

	if err := utils.ExecTaskInDir(tempDir, cmdArgs...); err != nil {
		return fmt.Errorf("failed to add task: %v\n %v", err, cmdArgs)
	}

	var taskID string
	if req.End != "" || len(req.Annotations) > 0 {
		output, err := utils.ExecTaskOutputInDir(tempDir, "+LATEST", "_ids")
		if err != nil {
			return fmt.Errorf("failed to get latest task Id: %v", err)
		}

		taskID = strings.TrimSpace(string(output))
	}

	if req.End != "" {
		end, err := utils.ConvertISOToTaskwarriorFormat(req.End)
		if err != nil {
			return fmt.Errorf("unexpected end date format error: %v", err)
		}
		doneArgs := []string{"rc.confirmation=off", taskID, "done", "end:" + end}
		if err := utils.ExecTaskInDir(tempDir, doneArgs...); err != nil {
			return fmt.Errorf("failed to complete task with end date: %v", err)
		}
	}

	if len(req.Annotations) > 0 {
		for _, annotation := range req.Annotations {
			if annotation.Description != "" {
				annotateArgs := []string{"rc.confirmation=off", taskID, "annotate", annotation.Description}
				if err := utils.ExecTaskInDir(tempDir, annotateArgs...); err != nil {
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
