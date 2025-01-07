package tw

import (
	"ccsync_backend/models"
	"ccsync_backend/utils"
	"encoding/json"
	"fmt"
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

	return tasks, nil
}
