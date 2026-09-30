package utils

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

func ExecCommandInDir(dir, command string, args ...string) error {
	cmd := exec.Command(command, args...)
	cmd.Dir = dir
	return cmd.Run()
}

func ExecCommand(command string, args ...string) error {
	cmd := exec.Command(command, args...)
	return cmd.Run()
}

func ExecCommandForOutputInDir(dir, command string, args ...string) ([]byte, error) {
	cmd := exec.Command(command, args...)
	cmd.Dir = dir
	return cmd.Output()
}

// TaskwarriorEnv returns a copy of the process environment with TASKDATA and
// TASKRC pointing at tempDir so Taskwarrior does not use /root/.task.
func TaskwarriorEnv(tempDir string) []string {
	env := os.Environ()
	filtered := make([]string, 0, len(env)+2)
	for _, e := range env {
		if strings.HasPrefix(e, "TASKDATA=") || strings.HasPrefix(e, "TASKRC=") {
			continue
		}
		filtered = append(filtered, e)
	}
	filtered = append(filtered,
		"TASKDATA="+tempDir,
		"TASKRC="+filepath.Join(tempDir, "taskrc"),
	)
	return filtered
}

func ExecTaskInDir(dir string, args ...string) error {
	cmd := exec.Command("task", args...)
	cmd.Dir = dir
	cmd.Env = TaskwarriorEnv(dir)
	return cmd.Run()
}

func ExecTaskOutputInDir(dir string, args ...string) ([]byte, error) {
	cmd := exec.Command("task", args...)
	cmd.Dir = dir
	cmd.Env = TaskwarriorEnv(dir)
	return cmd.Output()
}
