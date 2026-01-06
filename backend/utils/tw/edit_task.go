package tw

import (
	"ccsync_backend/models"
	"ccsync_backend/utils"
	"encoding/json"
	"fmt"
	"os"
	"strings"
)

func EditTaskInTaskwarrior(
	req models.EditTaskRequestBody,
) error {

	tempDir, err := os.MkdirTemp("", "taskwarrior-"+req.Email)
	if err != nil {
		return fmt.Errorf("failed to create temporary directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	origin := os.Getenv("CONTAINER_ORIGIN")
	if err := SetTaskwarriorConfig(
		tempDir,
		req.EncryptionSecret,
		origin,
		req.UUID,
	); err != nil {
		return err
	}

	if err := SyncTaskwarrior(tempDir); err != nil {
		return err
	}

	// build single modify command
	args := []string{"modify", req.TaskUUID}

	if req.Description != "" {
		args = append(args, req.Description)
	}

	if req.Project != "" {
		args = append(args, "project:"+req.Project)
	}

	if req.Start != "" {
		args = append(args, "start:"+req.Start)
	}

	if req.Entry != "" {
		args = append(args, "entry:"+req.Entry)
	}

	// wait date logic (explicitly requested in review)
	if req.Wait != "" {
		formattedWait := req.Wait + "T00:00:00"
		args = append(args, "wait:"+formattedWait)
	}

	if req.End != "" {
		args = append(args, "end:"+req.End)
	}

	if len(req.Depends) > 0 {
		args = append(args, "depends:"+strings.Join(req.Depends, ","))
	}

	if req.Due != "" {
		args = append(args, "due:"+req.Due)
	}

	if req.Recur != "" {
		args = append(args, "recur:"+req.Recur)
	}

	for _, tag := range req.Tags {
		if strings.HasPrefix(tag, "+") || strings.HasPrefix(tag, "-") {
			args = append(args, tag)
		} else if tag != "" {
			args = append(args, "+"+tag)
		}
	}

	if err := utils.ExecCommandInDir(tempDir, "task", args...); err != nil {
		return fmt.Errorf("failed to edit task %s: %v", req.TaskUUID, err)
	}

	// rewritten annotation handling (as requested)
	if len(req.Annotations) > 0 {
		output, err := utils.ExecCommandForOutputInDir(
			tempDir,
			"task",
			req.TaskUUID,
			"export",
		)
		if err != nil {
			return fmt.Errorf("failed to export task: %v", err)
		}

		var tasks []map[string]interface{}
		if err := json.Unmarshal(output, &tasks); err != nil || len(tasks) == 0 {
			return fmt.Errorf("invalid export output for annotations")
		}

		for _, annotation := range req.Annotations {
			if annotation.Description != "" {
				if err := utils.ExecCommandInDir(
					tempDir,
					"task",
					req.TaskUUID,
					"annotate",
					annotation.Description,
				); err != nil {
					return fmt.Errorf(
						"failed to add annotation %s: %v",
						annotation.Description,
						err,
					)
				}
			}
		}
	}

	if err := SyncTaskwarrior(tempDir); err != nil {
		return err
	}

	return nil
}
