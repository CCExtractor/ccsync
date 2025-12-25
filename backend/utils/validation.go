package utils

import (
	"fmt"
)

// ValidateDependencies validates dependencies
func ValidateDependencies(depends []string, currentTaskUUID string) error {
	if len(depends) == 0 {
		return nil
	}

	// check for self-dependency
	for _, dep := range depends {
		if dep == currentTaskUUID {
			return fmt.Errorf("task cannot depend on itself: %s", dep)
		}
	}

	return nil
}
