package tw

import (
	"fmt"
	"os/exec"
)

// logic to set tw config on backend
func SetTaskwarriorConfig(tempDir, encryptionSecret, origin, UUID string) error {
	configCmds := [][]string{
		{"task", "config", "sync.encryption_secret", encryptionSecret, "rc.confirmation=off"},
		{"task", "config", "sync.server.origin", origin, "rc.confirmation=off"},
		{"task", "config", "sync.server.client_id", UUID, "rc.confirmation=off"},
	}

	for _, args := range configCmds {
		cmd := exec.Command(args[0], args[1:]...)
		cmd.Dir = tempDir
		if err := cmd.Run(); err != nil {
			return fmt.Errorf("error setting Taskwarrior config (%v): %v", args, err)
		}
	}
	return nil
}
