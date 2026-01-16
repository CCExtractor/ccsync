package tw

import (
	"ccsync_backend/models"
	"testing"
)

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
	if err := EditTaskInTaskwarrior(req); err != nil {
		t.Logf("EditTaskInTaskwarrior returned error: %v", err)
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

	if err := EditTaskInTaskwarrior(req); err != nil {
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

	if err := EditTaskInTaskwarrior(req); err != nil {
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

	if err := EditTaskInTaskwarrior(req); err != nil {
		t.Logf("EditTaskInTaskwarrior returned error: %v", err)
	}
}
