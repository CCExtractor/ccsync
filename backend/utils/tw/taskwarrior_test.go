package tw

import (
	"ccsync_backend/models"
	"testing"
)

func TestSetTaskwarriorConfig(t *testing.T) {
	err := SetTaskwarriorConfig("./", "encryption_secret", "container_origin", "client_id")
	if err != nil {
		t.Errorf("SetTaskwarriorConfig() failed: %v", err)
	}
}

func TestSyncTaskwarrior(t *testing.T) {
	err := SyncTaskwarrior("./")
	if err != nil {
		t.Errorf("SyncTaskwarrior failed: %v", err)
	}
}

func TestAddTaskToTaskwarrior(t *testing.T) {
	err := AddTaskToTaskwarrior(
		"email",
		"encryption_secret",
		"clientId",
		"description",
		"",
		"H",
		"2025-03-03",
		"2025-03-03T10:30:00",
		"2025-03-01",
		"2025-03-01",
		"2025-03-01",
		"daily",
		[]string{},
		[]models.Annotation{{Description: "note"}},
		[]string{},
	)

	if err != nil {
		t.Errorf("AddTaskToTaskwarrior failed: %v", err)
	}
}

func TestEditTaskInATaskwarrior(t *testing.T) {
	req := models.EditTaskRequestBody{
		UUID:             "uuid",
		Email:            "email",
		EncryptionSecret: "encryptionSecret",
		TaskUUID:         "taskuuid",
		Description:      "description",
		Project:          "project",
		Start:            "2025-11-29T18:30:00.000Z",
		Entry:            "2025-11-29T18:30:00.000Z",
		Wait:             "2025-11-29T18:30:00.000Z",
		End:              "2025-11-30T18:30:00.000Z",
		Due:              "2025-12-01T18:30:00.000Z",
		Recur:            "weekly",
		Annotations:      []models.Annotation{{Description: "test annotation"}},
	}

	err := EditTaskInTaskwarrior(req)
	if err != nil {
		t.Logf("EditTaskInTaskwarrior returned error: %v", err)
	}
}

func TestExportTasks(t *testing.T) {
	task, err := ExportTasks("./")
	if task == nil || err != nil {
		t.Errorf("ExportTasks() failed: %v", err)
	}
}

func TestEditTaskWithTagAddition(t *testing.T) {
	req := models.EditTaskRequestBody{
		UUID:             "uuid",
		Email:            "email",
		EncryptionSecret: "encryptionSecret",
		TaskUUID:         "taskuuid",
		Tags:             []string{"+urgent", "+important"},
		Project:          "project",
		Start:            "2025-11-29T18:30:00.000Z",
		Entry:            "2025-11-29T18:30:00.000Z",
		Wait:             "2025-11-29T18:30:00.000Z",
		End:              "2025-11-30T18:30:00.000Z",
		Due:              "2025-12-01T18:30:00.000Z",
		Recur:            "daily",
	}

	err := EditTaskInTaskwarrior(req)
	if err != nil {
		t.Logf("EditTaskInTaskwarrior returned error: %v", err)
	}
}

func TestEditTaskWithTagRemoval(t *testing.T) {
	req := models.EditTaskRequestBody{
		UUID:             "uuid",
		Email:            "email",
		EncryptionSecret: "encryptionSecret",
		TaskUUID:         "taskuuid",
		Tags:             []string{"-work", "-lowpriority"},
		Project:          "project",
		Start:            "2025-11-29T18:30:00.000Z",
		Entry:            "2025-11-29T18:30:00.000Z",
		Wait:             "2025-11-29T18:30:00.000Z",
		End:              "2025-11-30T18:30:00.000Z",
		Due:              "2025-12-01T18:30:00.000Z",
		Recur:            "monthly",
	}

	err := EditTaskInTaskwarrior(req)
	if err != nil {
		t.Logf("EditTaskInTaskwarrior returned error: %v", err)
	}
}

func TestEditTaskWithMixedTagOperations(t *testing.T) {
	req := models.EditTaskRequestBody{
		UUID:             "uuid",
		Email:            "email",
		EncryptionSecret: "encryptionSecret",
		TaskUUID:         "taskuuid",
		Tags:             []string{"+urgent", "-work", "normal"},
		Project:          "project",
		Start:            "2025-11-29T18:30:00.000Z",
		Entry:            "2025-11-29T18:30:00.000Z",
		Wait:             "2025-11-29T18:30:00.000Z",
		End:              "2025-11-30T18:30:00.000Z",
		Due:              "2025-12-01T18:30:00.000Z",
		Recur:            "yearly",
	}

	err := EditTaskInTaskwarrior(req)
	if err != nil {
		t.Logf("EditTaskInTaskwarrior returned error: %v", err)
	}
}
