package tw

import (
	"ccsync_backend/models"
	"ccsync_backend/utils"
	"encoding/json"
	"fmt"
	"os"
	"strings"
)

func EditTaskInTaskwarrior(params models.EditTaskParams) error {
	tempDir, err := os.MkdirTemp("", utils.SafeTempDirPrefix("taskwarrior-", params.Email))
	if err != nil {
		return fmt.Errorf("failed to create temporary directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	origin := os.Getenv("CONTAINER_ORIGIN")
	if err := SetTaskwarriorConfig(tempDir, params.EncryptionSecret, origin, params.UUID); err != nil {
		return err
	}

	if err := SyncTaskwarrior(tempDir); err != nil {
		return err
	}

	modifyArgs := []string{params.TaskUUID, "modify"}

	if params.Description != "" {
		modifyArgs = append(modifyArgs, params.Description)
	}

	if params.Project != "" {
		modifyArgs = append(modifyArgs, "project:"+params.Project)
	}

	if params.Wait != "" {
		formattedWait := params.Wait + "T00:00:00"
		modifyArgs = append(modifyArgs, "wait:"+formattedWait)
	}

	if params.Start != "" {
		modifyArgs = append(modifyArgs, "start:"+params.Start)
	}

	if params.Entry != "" {
		modifyArgs = append(modifyArgs, "entry:"+params.Entry)
	}

	if params.End != "" {
		modifyArgs = append(modifyArgs, "end:"+params.End)
	}

	dependsStr := strings.Join(params.Depends, ",")
	modifyArgs = append(modifyArgs, "depends:"+dependsStr)

	if params.Due != "" {
		formattedDue := params.Due + "T00:00:00"
		modifyArgs = append(modifyArgs, "due:"+formattedDue)
	}

	if params.Recur != "" {
		modifyArgs = append(modifyArgs, "recur:"+params.Recur)
	}

	for _, tag := range params.Tags {
		if strings.HasPrefix(tag, "+") {
			modifyArgs = append(modifyArgs, tag)
		} else if strings.HasPrefix(tag, "-") {
			modifyArgs = append(modifyArgs, tag)
		} else {
			modifyArgs = append(modifyArgs, "+"+tag)
		}
	}

	if err := utils.ExecCommand("task", modifyArgs...); err != nil {
		return fmt.Errorf("failed to edit task: %v", err)
	}

	if len(params.Annotations) >= 0 {
		output, err := utils.ExecCommandForOutputInDir(tempDir, "task", params.TaskUUID, "export")
		if err == nil {
			var tasks []map[string]interface{}
			if err := json.Unmarshal(output, &tasks); err == nil && len(tasks) > 0 {
				if existingAnnotations, ok := tasks[0]["annotations"].([]interface{}); ok {
					for _, ann := range existingAnnotations {
						if annMap, ok := ann.(map[string]interface{}); ok {
							if desc, ok := annMap["description"].(string); ok {
								utils.ExecCommand("task", params.TaskUUID, "denotate", desc)
							}
						}
					}
				}
			}
		}

		for _, annotation := range params.Annotations {
			if annotation.Description != "" {
				if err := utils.ExecCommand("task", params.TaskUUID, "annotate", annotation.Description); err != nil {
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
