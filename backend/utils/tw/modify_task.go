package tw

import (
	"fmt"
	"os"
	"os/exec"
	"strings"
)

func ModifyTaskInTaskwarrior(uuid, description, project, priority, status, due, email, encryptionSecret, taskuuid string) error {
	cmd := exec.Command("rm", "-rf", "/root/.task")
	if err := cmd.Run(); err != nil {
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

	escapedDescription := fmt.Sprintf(`description:"%s"`, strings.ReplaceAll(description, `"`, `\"`))

	cmd = exec.Command("task", taskuuid, "modify", escapedDescription)
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to edit task: %v", err)
	}

	escapedProject := fmt.Sprintf(`project:%s`, strings.ReplaceAll(project, `"`, `\"`))
	cmd = exec.Command("task", taskuuid, "modify", escapedProject)
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to edit task project: %v", err)
	}

	escapedPriority := fmt.Sprintf(`priority:%s`, strings.ReplaceAll(priority, `"`, `\"`))
	cmd = exec.Command("task", taskuuid, "modify", escapedPriority)
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to edit task priority: %v", cmd)
	}

	escapedDue := fmt.Sprintf(`due:%s`, strings.ReplaceAll(due, `"`, `\"`))
	cmd = exec.Command("task", taskuuid, "modify", escapedDue)
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to edit task due: %v", err)
	}

	// escapedStatus := fmt.Sprintf(`status:%s`, strings.ReplaceAll(status, `"`, `\"`))
	if status == "completed" {
		cmd = exec.Command("task", taskuuid, "done", "rc.confirmation=off")
		cmd.Run()
	} else if status == "deleted" {
		cmd = exec.Command("task", taskuuid, "delete", "rc.confirmation=off")
		cmd.Run()
	}

	// Sync Taskwarrior again
	if err := SyncTaskwarrior(tempDir); err != nil {
		return err
	}
	return nil
}
