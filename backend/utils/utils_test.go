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

func Test_ValidateDependencies_EmptyList(t *testing.T) {
	depends := []string{}
	currentTaskUUID := "current-task-uuid"
	err := ValidateDependencies(depends, currentTaskUUID)
	assert.NoError(t, err)
}

// Circular Dependency Detection Tests
func Test_detectCycle_NoCycle(t *testing.T) { //A -> B -> C
	graph := map[string][]string{
		"A": {"B"},
		"B": {"C"},
		"C": {},
	}

	hasCycle := detectCycle(graph, "A")
	assert.False(t, hasCycle, "Should not detect cycle in linear dependency")
}

func Test_detectCycle_SimpleCycle(t *testing.T) { // A -> B -> A
	graph := map[string][]string{
		"A": {"B"},
		"B": {"A"},
	}

	hasCycle := detectCycle(graph, "A")
	assert.True(t, hasCycle, "Should detect simple cycle A -> B -> A")
}

func Test_detectCycle_ComplexCycle(t *testing.T) { // A -> B -> C -> A
	graph := map[string][]string{
		"A": {"B"},
		"B": {"C"},
		"C": {"A"},
	}

	hasCycle := detectCycle(graph, "A")
	assert.True(t, hasCycle, "Should detect complex cycle A -> B -> C -> A")
}
