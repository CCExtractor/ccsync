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
	uuid, taskUUID, email, encryptionSecret, description, project, start, entry, wait, end, due, recur string,
	tags, depends []string,
	annotations []models.Annotation,
) error {
	tempDir, err := os.MkdirTemp("", utils.SafeTempDirPrefix("taskwarrior-", email))
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

	modifyArgs := []string{taskUUID, "modify"}

	if description != "" {
		modifyArgs = append(modifyArgs, description)
	}

	if project != "" {
		modifyArgs = append(modifyArgs, "project:"+project)
	}

	if wait != "" {
		formattedWait := wait + "T00:00:00"
		modifyArgs = append(modifyArgs, "wait:"+formattedWait)
	}

	if start != "" {
		modifyArgs = append(modifyArgs, "start:"+start)
	}

	if entry != "" {
		modifyArgs = append(modifyArgs, "entry:"+entry)
	}

	if end != "" {
		modifyArgs = append(modifyArgs, "end:"+end)
	}

	dependsStr := strings.Join(depends, ",")
	modifyArgs = append(modifyArgs, "depends:"+dependsStr)

	if due != "" {
		formattedDue := due + "T00:00:00"
		modifyArgs = append(modifyArgs, "due:"+formattedDue)
	}

	if recur != "" {
		modifyArgs = append(modifyArgs, "recur:"+recur)
	}

	for _, tag := range tags {
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
