package controllers

import (
	"os"

	"github.com/charmbracelet/log"
)

// Logger is the global logger instance used across all controllers
var Logger *log.Logger

func init() {
	// Initialize logger with defaults if not set by main
	if Logger == nil {
		Logger = log.NewWithOptions(os.Stderr, log.Options{
			ReportCaller:    false,
			ReportTimestamp: true,
			TimeFormat:      "2006-01-02 15:04:05",
		})
		Logger.SetLevel(log.InfoLevel)
	}
}
