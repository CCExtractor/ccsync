package tw

import (
	"fmt"
	"testing"
)

func TestSetTaskwarriorConfig(t *testing.T) {
	err := SetTaskwarriorConfig("./", "encryption_secret", "container_origin", "client_id")
	if err != nil {
		t.Errorf("SetTaskwarriorConfig() failed: %v", err)
	} else {
		fmt.Println("SetTaskwarriorConfig test passed")
	}
}
func TestSyncTaskwarrior(t *testing.T) {
	err := SyncTaskwarrior("./")
	if err != nil {
		t.Errorf("SyncTaskwarrior failed: %v", err)
	} else {
		fmt.Println("Sync Dir test passed")
	}
}

func TestEditTaskInATaskwarrior(t *testing.T) {
	err := EditTaskInTaskwarrior("uuid", "description", "email", "encryptionSecret", "taskuuid", nil, "project", "2025-11-29T18:30:00.000Z", "2025-11-29T18:30:00.000Z", "2025-11-29T18:30:00.000Z")
	if err != nil {
		t.Errorf("EditTaskInTaskwarrior() failed: %v", err)
	} else {
		fmt.Println("Edit test passed")
	}
}

func TestExportTasks(t *testing.T) {
	task, err := ExportTasks("./")
	if task != nil && err == nil {
		fmt.Println("Task export test passed")
	} else {
		t.Errorf("ExportTasks() failed: %v", err)
	}
}

func TestAddTaskToTaskwarrior(t *testing.T) {
	err := AddTaskToTaskwarrior("email", "encryption_secret", "clientId", "description", "", "H", "2025-03-03", nil)
	if err != nil {
		t.Errorf("AddTaskToTaskwarrior failed: %v", err)
	} else {
		fmt.Println("Add task passed")
	}
}

func TestCompleteTaskInTaskwarrior(t *testing.T) {
	err := CompleteTaskInTaskwarrior("email", "encryptionSecret", "client_id", "taskuuid")
	if err != nil {
		t.Errorf("CompleteTaskInTaskwarrior failed: %v", err)
	} else {
		fmt.Println("Complete task passed")
	}
}

func TestAddTaskWithTags(t *testing.T) {
	err := AddTaskToTaskwarrior("email", "encryption_secret", "clientId", "description", "", "H", "2025-03-03", []string{"work", "important"})
	if err != nil {
		t.Errorf("AddTaskToTaskwarrior with tags failed: %v", err)
	} else {
		fmt.Println("Add task with tags passed")
	}
}

func TestEditTaskWithTagAddition(t *testing.T) {
	err := EditTaskInTaskwarrior("uuid", "description", "email", "encryptionSecret", "taskuuid", []string{"+urgent", "+important"}, "project", "2025-11-29T18:30:00.000Z", "2025-11-29T18:30:00.000Z", "2025-11-29T18:30:00.000Z")
	if err != nil {
		t.Errorf("EditTaskInTaskwarrior with tag addition failed: %v", err)
	} else {
		fmt.Println("Edit task with tag addition passed")
	}
}

func TestEditTaskWithTagRemoval(t *testing.T) {
	err := EditTaskInTaskwarrior("uuid", "description", "email", "encryptionSecret", "taskuuid", []string{"-work", "-lowpriority"}, "project", "2025-11-29T18:30:00.000Z", "2025-11-29T18:30:00.000Z", "2025-11-29T18:30:00.000Z")
	if err != nil {
		t.Errorf("EditTaskInTaskwarrior with tag removal failed: %v", err)
	} else {
		fmt.Println("Edit task with tag removal passed")
	}
}

func TestEditTaskWithMixedTagOperations(t *testing.T) {
	err := EditTaskInTaskwarrior("uuid", "description", "email", "encryptionSecret", "taskuuid", []string{"+urgent", "-work", "normal"}, "project", "2025-11-29T18:30:00.000Z", "2025-11-29T18:30:00.000Z", "2025-11-29T18:30:00.000Z")
	if err != nil {
		t.Errorf("EditTaskInTaskwarrior with mixed tag operations failed: %v", err)
	} else {
		fmt.Println("Edit task with mixed tag operations passed")
	}
}

func TestModifyTaskWithTags(t *testing.T) {
	err := ModifyTaskInTaskwarrior("uuid", "description", "project", "H", "pending", "2025-03-03", "email", "encryptionSecret", "taskuuid", []string{"+urgent", "-work", "normal"})
	if err != nil {
		t.Errorf("ModifyTaskInTaskwarrior with tags failed: %v", err)
	} else {
		fmt.Println("Modify task with tags passed")
	}
}
