package utils

import (
	"crypto/sha256"
	"encoding/hex"
	"os"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func Test_GenerateUUID(t *testing.T) {
	email := "test@example.com"
	id := "12345"
	expectedUUID := uuid.NewMD5(uuid.NameSpaceOID, []byte(email+id)).String()

	uuidStr := GenerateUUID(email, id)
	assert.Equal(t, expectedUUID, uuidStr)
}

func Test_GenerateEncryptionSecret(t *testing.T) {
	uuidStr := "uuid-test"
	email := "test@example.com"
	id := "12345"
	hash := sha256.New()
	hash.Write([]byte(uuidStr + email + id))
	expectedSecret := hex.EncodeToString(hash.Sum(nil))

	encryptionSecret := GenerateEncryptionSecret(uuidStr, email, id)
	assert.Equal(t, expectedSecret, encryptionSecret)
}

func Test_ExecCommandInDir(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "testdir")
	if err != nil {
		t.Fatalf("Failed to create temp directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	tempFile := tempDir + "/testfile"
	if err := os.WriteFile(tempFile, []byte("hello"), 0644); err != nil {
		t.Fatalf("Failed to create temp file: %v", err)
	}

	command := "ls"
	args := []string{"-l"}

	if err := ExecCommandInDir(tempDir, command, args...); err != nil {
		t.Errorf("ExecCommandInDir failed: %v", err)
	}
}

func Test_ExecCommand(t *testing.T) {
	command := "echo"
	args := []string{"hello world"}

	if err := ExecCommand(command, args...); err != nil {
		t.Errorf("ExecCommand failed: %v", err)
	}
}

func Test_ExecCommandForOutputInDir(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "testdir")
	if err != nil {
		t.Fatalf("Failed to create temp directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	tempFile := tempDir + "/testfile"
	if err := os.WriteFile(tempFile, []byte("hello"), 0644); err != nil {
		t.Fatalf("Failed to create temp file: %v", err)
	}

	command := "ls"
	args := []string{"-1"}

	output, err := ExecCommandForOutputInDir(tempDir, command, args...)
	if err != nil {
		t.Errorf("ExecCommandForOutputInDir failed: %v", err)
	}

	if string(output) == "" {
		t.Errorf("Expected output but got empty result")
	}
}

func Test_ValidateDependencies_ValidDependencies(t *testing.T) {
	depends := []string{"task-uuid-1", "task-uuid-2"}
	currentTaskUUID := "current-task-uuid"
	err := ValidateDependencies(depends, currentTaskUUID)
	assert.NoError(t, err)
}

func Test_ValidateDependencies_EmptyList(t *testing.T) {
	depends := []string{}
	currentTaskUUID := "current-task-uuid"
	err := ValidateDependencies(depends, currentTaskUUID)
	assert.NoError(t, err)
}

func TestConvertISOToTaskwarriorFormat(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
		hasError bool
	}{
		{
			name:     "ISO datetime with milliseconds (frontend format)",
			input:    "2025-12-27T14:30:00.000Z",
			expected: "2025-12-27T14:30:00",
			hasError: false,
		},
		{
			name:     "ISO datetime at midnight (explicit datetime)",
			input:    "2025-12-27T00:00:00.000Z",
			expected: "2025-12-27T00:00:00",
			hasError: false,
		},
		{
			name:     "Date only format",
			input:    "2025-12-27",
			expected: "2025-12-27",
			hasError: false,
		},
		{
			name:     "Empty string",
			input:    "",
			expected: "",
			hasError: false,
		},
		{
			name:     "Invalid format",
			input:    "invalid-date",
			expected: "",
			hasError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := ConvertISOToTaskwarriorFormat(tt.input)

			if tt.hasError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tt.expected, result)
			}
		})
	}
}
