package logger

import (
	"os"
	"strings"

	"github.com/charmbracelet/log"
)

var Logger *log.Logger

// Initialize sets up the colored logger with configurable log level
func Initialize() {
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

// Helper functions for common logging patterns

// Info logs an informational message with optional key-value pairs (green)
func Info(msg string, keyvals ...interface{}) {
	if Logger == nil {
		Initialize()
	}
	Logger.Info(msg, keyvals...)
}

// Warn logs a warning message with optional key-value pairs (yellow)
func Warn(msg string, keyvals ...interface{}) {
	if Logger == nil {
		Initialize()
	}
	Logger.Warn(msg, keyvals...)
}

// Error logs an error message with optional key-value pairs (red)
func Error(msg string, keyvals ...interface{}) {
	if Logger == nil {
		Initialize()
	}
	Logger.Error(msg, keyvals...)
}

// Debug logs a debug message with optional key-value pairs
func Debug(msg string, keyvals ...interface{}) {
	if Logger == nil {
		Initialize()
	}
	Logger.Debug(msg, keyvals...)
}

// Fatal logs a fatal error and exits with optional key-value pairs
func Fatal(msg string, keyvals ...interface{}) {
	if Logger == nil {
		Initialize()
	}
	Logger.Fatal(msg, keyvals...)
}

// With returns a logger with structured fields
func With(keyvals ...interface{}) *log.Logger {
	return Logger.With(keyvals...)
}

// Formatted logging functions for printf-style messages

// Infof logs a formatted informational message
func Infof(format string, args ...interface{}) {
	if Logger == nil {
		Initialize()
	}
	Logger.Infof(format, args...)
}

// Warnf logs a formatted warning message
func Warnf(format string, args ...interface{}) {
	if Logger == nil {
		Initialize()
	}
	Logger.Warnf(format, args...)
}

// Errorf logs a formatted error message
func Errorf(format string, args ...interface{}) {
	if Logger == nil {
		Initialize()
	}
	Logger.Errorf(format, args...)
}

// Debugf logs a formatted debug message
func Debugf(format string, args ...interface{}) {
	if Logger == nil {
		Initialize()
	}
	Logger.Debugf(format, args...)
}

// Fatalf logs a formatted fatal error and exits
func Fatalf(format string, args ...interface{}) {
	if Logger == nil {
		Initialize()
	}
	Logger.Fatalf(format, args...)
}
