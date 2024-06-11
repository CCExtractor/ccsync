package main

import (
	"fmt"
	"testing"
)

func TestSetTaskwarriorConfig(t *testing.T) {
	err := SetTaskwarriorConfig("", "your_secret", "your_container_origin", "your_client_id")
	if err != nil {
		t.Errorf("SetTaskwarriorConfig() failed: %v", err)
	} else {
		fmt.Println("SetTaskwarriorConfig test passed")
	}
}

func TestEditTaskInATaskwarrior(t *testing.T) {
	err := EditTaskInTaskwarrior("your_task_uuid_here", "description")
	if err != nil {
		t.Errorf("EditTaskInTaskwarrior() failed: %v", err)
	} else {
		fmt.Println("Edit test passed")
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
