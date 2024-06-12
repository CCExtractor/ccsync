package main

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

func TestSyncTasksWithTaskwarrior(t *testing.T) {
	err := SyncTasksWithTaskwarrior()
	if err != nil {
		t.Errorf("SyncTasksWithTaskwarrior() failed: %v", err)
	} else {
		fmt.Println("Sync test passed")
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
	err := EditTaskInTaskwarrior("task_uuid", "description")
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
	err := AddTaskToTaskwarrior("email", "encryption_secret", "clientId", "description", "", "H")
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
