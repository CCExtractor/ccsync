package tw

import (
	"ccsync_backend/models"
	"encoding/json"
	"fmt"
	"os/exec"
)

// export the tasks so as to add them to DB
func ExportTasks(tempDir string) ([]models.Task, error) {
	cmd := exec.Command("task", "export")
	cmd.Dir = tempDir
	output, err := cmd.Output()
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