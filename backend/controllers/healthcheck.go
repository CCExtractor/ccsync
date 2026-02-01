package controllers

import (
	"encoding/json"
	"net/http"
	"os/exec"
)

func HealthCheckHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	status := "healthy"
	statusCode := http.StatusOK

	// Check if taskwarrior is reachable
	_, err := exec.LookPath("task")
	if err != nil {
		status = "unhealthy: taskwarrior binary not found"
		statusCode = http.StatusServiceUnavailable
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(map[string]string{
		"status":  status,
		"service": "ccsync-backend",
	})
}
