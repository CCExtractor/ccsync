package utils

import (
	"os"

	"github.com/charmbracelet/log"
)

var Logger *log.Logger

func init() {
	logLevelStr := os.Getenv("LOG_LEVEL")
	logLevel := log.InfoLevel
	if logLevelStr != "" {
		parsedLevel, err := log.ParseLevel(logLevelStr)
		if err == nil {
			logLevel = parsedLevel
		}
	}

	Logger = log.NewWithOptions(os.Stderr, log.Options{
		ReportTimestamp: true,
		TimeFormat:      "2006-01-02 15:04:05",
		Level:           logLevel,
	})
}
