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
	uuid, description, email, encryptionSecret, taskUUID string,
	tags []string,
	project string,
	start string,
	entry string,
	wait string,
	end string,
	depends []string,
	due string,
	recur string,
	annotations []models.Annotation,
) error {

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

	args := []string{"modify", taskUUID}

	if description != "" {
		args = append(args, description)
	}

	if project != "" {
		args = append(args, "project:"+project)
	}

	if start != "" {
		args = append(args, "start:"+start)
	}

	if entry != "" {
		args = append(args, "entry:"+entry)
	}

	if wait != "" {
		args = append(args, "wait:"+wait)
	}

	if end != "" {
		args = append(args, "end:"+end)
	}

	if len(depends) > 0 {
		args = append(args, "depends:"+strings.Join(depends, ","))
	}

	if due != "" {
		args = append(args, "due:"+due)
	}

	if recur != "" {
		args = append(args, "recur:"+recur)
	}

	for _, tag := range tags {
		if strings.HasPrefix(tag, "+") || strings.HasPrefix(tag, "-") {
			args = append(args, tag)
		} else {
			args = append(args, "+"+tag)
		}
	}

	if err := utils.ExecCommand("task", args...); err != nil {
		return fmt.Errorf("failed to edit task %s: %v", taskUUID, err)
	}

	if len(annotations) >= 0 {
		output, err := utils.ExecCommandForOutputInDir(tempDir, "task", taskUUID, "export")
		if err == nil {
			var tasks []map[string]interface{}
			if err := json.Unmarshal(output, &tasks); err == nil && len(tasks) > 0 {
				if existingAnnotations, ok := tasks[0]["annotations"].([]interface{}); ok {
					for _, ann := range existingAnnotations {
						if annMap, ok := ann.(map[string]interface{}); ok {
							if desc, ok := annMap["description"].(string); ok {
								utils.ExecCommand("task", taskUUID, "denotate", desc)
							}
						}
					}
				}
			}
		}

		for _, annotation := range annotations {
			if annotation.Description != "" {
				if err := utils.ExecCommand("task", taskUUID, "annotate", annotation.Description); err != nil {
					return fmt.Errorf("failed to add annotation %s: %v", annotation.Description, err)
				}
			}
		}
	}

	if err := SyncTaskwarrior(tempDir); err != nil {
		return err
	}

	return nil
}