package main

import (
	"ccsync_backend/utils"
	"ccsync_backend/utils/tw"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestSetTaskwarriorConfig(t *testing.T) {
	err := tw.SetTaskwarriorConfig("./", "encryption_secret", "container_origin", "client_id")
	if err != nil {
		t.Errorf("SetTaskwarriorConfig() failed: %v", err)
	} else {
		fmt.Println("SetTaskwarriorConfig test passed")
	}
}
func TestSyncTaskwarrior(t *testing.T) {
	err := tw.SyncTaskwarrior("./")
	if err != nil {
		t.Errorf("SyncTaskwarrior failed: %v", err)
	} else {
		fmt.Println("Sync Dir test passed")
	}
}

func TestEditTaskInATaskwarrior(t *testing.T) {
	err := tw.EditTaskInTaskwarrior("uuid", "description", "email", "encryptionSecret", "taskuuid")
	if err != nil {
		t.Errorf("EditTaskInTaskwarrior() failed: %v", err)
	} else {
		fmt.Println("Edit test passed")
	}
}

func TestExportTasks(t *testing.T) {
	task, err := tw.ExportTasks("./")
	if task != nil && err == nil {
		fmt.Println("Task export test passed")
	} else {
		t.Errorf("ExportTasks() failed: %v", err)
	}
}

func TestAddTaskToTaskwarrior(t *testing.T) {
	err := tw.AddTaskToTaskwarrior("email", "encryption_secret", "clientId", "description", "", "H", "2025-03-03")
	if err != nil {
		t.Errorf("AddTaskToTaskwarrior failed: %v", err)
	} else {
		fmt.Println("Add task passed")
	}
}

func TestCompleteTaskInTaskwarrior(t *testing.T) {
	err := tw.CompleteTaskInTaskwarrior("email", "encryptionSecret", "client_id", "taskuuid")
	if err != nil {
		t.Errorf("CompleteTaskInTaskwarrior failed: %v", err)
	} else {
		fmt.Println("Complete task passed")
	}
}

func Test_GenerateUUID(t *testing.T) {
	email := "test@example.com"
	id := "12345"
	expectedUUID := uuid.NewMD5(uuid.NameSpaceOID, []byte(email+id)).String()

	uuidStr := utils.GenerateUUID(email, id)
	assert.Equal(t, expectedUUID, uuidStr)
}

func Test_GenerateEncryptionSecret(t *testing.T) {
	uuidStr := "uuid-test"
	email := "test@example.com"
	id := "12345"
	hash := sha256.New()
	hash.Write([]byte(uuidStr + email + id))
	expectedSecret := hex.EncodeToString(hash.Sum(nil))

	encryptionSecret := utils.GenerateEncryptionSecret(uuidStr, email, id)
	assert.Equal(t, expectedSecret, encryptionSecret)
}
