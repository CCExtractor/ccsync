package tw

import (
	"ccsync_backend/models"
	"ccsync_backend/utils"
	"encoding/json"
	"fmt"
	"time"
)

// export the tasks so as to add them to DB
func ExportTasks(tempDir string) ([]models.Task, error) {
	output, err := utils.ExecCommandForOutputInDir(tempDir, "task", "export")
	if err != nil {
		return nil, fmt.Errorf("error executing Taskwarrior export command: %v", err)
	}

	// Parse the exported tasks
	var tasks []models.Task
	if err := json.Unmarshal(output, &tasks); err != nil {
		return nil, fmt.Errorf("error parsing tasks: %v", err)
	}

	now := time.Now()
	for i := range tasks {
		if tasks[i].Status != "pending" || tasks[i].Due == "" {
			continue
		}

		// Taskwarrior uses timestamps like 20060102T150405Z
		dueTime, err := time.Parse("20060102T150405Z", tasks[i].Due)
		if err != nil {
			// Fallback to RFC3339
			dueTime, err = time.Parse(time.RFC3339, tasks[i].Due)
			if err != nil {
				continue
			}
		}

		if dueTime.Before(now) {
			tasks[i].Status = "overdue"
		}
	}

	return tasks, nil
}
