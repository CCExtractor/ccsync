package controllers

import (
	"encoding/json"
	"net/http"
	"os/exec"
	"regexp"
	"strconv"
)

func HealthCheckHandler(w http.ResponseWriter, r *http.Request) {
	// if it get any other request other than get then it will show error
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	// Default state is healthy
	status := "healthy"
	statusCode := http.StatusOK

	// checks the taskwarrior version and if the command fails will give 503 (dependency missing)
	cmd := exec.Command("task", "--version")
	output, err := cmd.Output()
	if err != nil {
		status = "unhealthy: taskwarrior not found or failed to execute"
		statusCode = http.StatusServiceUnavailable
	} else {
		re := regexp.MustCompile(`(\d+)\.(\d+)`)
		matches := re.FindStringSubmatch(string(output))

		if len(matches) < 3 {
			status = "unhealthy: unable to determine taskwarrior version"
			statusCode = http.StatusServiceUnavailable
		} else {
			// check the taskwarrior version (major version should be >= 3 )
			major, _ := strconv.Atoi(matches[1])

			if major < 3 {
				status = "unhealthy: unsupported taskwarrior version (>= 3.0 required)"
				statusCode = http.StatusServiceUnavailable
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(map[string]string{
		"status":  status,
		"service": "ccsync-backend",
	})
}
