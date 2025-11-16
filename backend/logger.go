package main

import (
	"os"
	"strings"

	"github.com/charmbracelet/log"
)

// Logger is the global logger instance
var Logger *log.Logger

// InitLogger sets up the colored logger with configurable log level
func InitLogger() {
	Logger = log.NewWithOptions(os.Stderr, log.Options{
		ReportCaller:    false,
		ReportTimestamp: true,
		TimeFormat:      "2006-01-02 15:04:05",
	})

	// Get log level from environment variable, default to Info
	logLevelStr := strings.ToLower(os.Getenv("LOG_LEVEL"))
	var logLevel log.Level

	switch logLevelStr {
	case "debug":
		logLevel = log.DebugLevel
	case "info":
		logLevel = log.InfoLevel
	case "warn", "warning":
		logLevel = log.WarnLevel
	case "error":
		logLevel = log.ErrorLevel
	case "fatal":
		logLevel = log.FatalLevel
	default:
		logLevel = log.InfoLevel
	}

	Logger.SetLevel(logLevel)
}
