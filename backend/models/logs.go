package models

import (
	"sync"
	"time"

	"ccsync_backend/utils"
)

// LogEntry represents a single log entry for sync operations
type LogEntry struct {
	Timestamp string `json:"timestamp"`
	Level     string `json:"level"` // INFO, WARN, ERROR
	Message   string `json:"message"`
	SyncID    string `json:"syncId,omitempty"`
	Operation string `json:"operation,omitempty"`
}

// LogStore manages the in-memory log storage with a max of 100 entries
type LogStore struct {
	mu      sync.RWMutex
	entries []LogEntry
	maxSize int
}

var (
	// GlobalLogStore is the global instance of the log store
	GlobalLogStore *LogStore
	once           sync.Once
)

// GetLogStore returns the singleton instance of LogStore
func GetLogStore() *LogStore {
	once.Do(func() {
		GlobalLogStore = &LogStore{
			entries: make([]LogEntry, 0, 100),
			maxSize: 100,
		}
	})
	return GlobalLogStore
}

// AddLog adds a new log entry to the store
func (ls *LogStore) AddLog(level, message, syncID, operation string) {
	ls.mu.Lock()
	defer ls.mu.Unlock()

	entry := LogEntry{
		Timestamp: time.Now().Format(time.RFC3339),
		Level:     level,
		Message:   message,
		SyncID:    syncID,
		Operation: operation,
	}

	// Also log to the structured logger
	switch level {
	case "INFO":
		utils.Logger.Infof(message)
	case "WARN":
		utils.Logger.Warnf(message)
	case "ERROR":
		utils.Logger.Errorf(message)
	default:
		utils.Logger.Infof(message)
	}

	// Add to the end
	ls.entries = append(ls.entries, entry)

	// Keep only the last maxSize entries
	if len(ls.entries) > ls.maxSize {
		ls.entries = ls.entries[len(ls.entries)-ls.maxSize:]
	}
}

// GetLogs returns the last N log entries (or all if N > total)
func (ls *LogStore) GetLogs(last int) []LogEntry {
	ls.mu.RLock()
	defer ls.mu.RUnlock()

	if last <= 0 || last > len(ls.entries) {
		// Return all entries in reverse order (newest first)
		result := make([]LogEntry, len(ls.entries))
		for i, entry := range ls.entries {
			result[len(ls.entries)-1-i] = entry
		}
		return result
	}

	// Return last N entries in reverse order (newest first)
	result := make([]LogEntry, last)
	for i := 0; i < last; i++ {
		result[i] = ls.entries[len(ls.entries)-1-i]
	}
	return result
}

// GetLogsByUser returns the last N log entries for a specific user (filtered by SyncID/UUID)
func (ls *LogStore) GetLogsByUser(last int, userUUID string) []LogEntry {
	ls.mu.RLock()
	defer ls.mu.RUnlock()

	// Filter entries by user UUID
	var userEntries []LogEntry
	for _, entry := range ls.entries {
		if entry.SyncID == userUUID {
			userEntries = append(userEntries, entry)
		}
	}

	// Determine how many to return
	count := last
	if count <= 0 || count > len(userEntries) {
		count = len(userEntries)
	}

	// Return last N entries in reverse order (newest first)
	result := make([]LogEntry, count)
	for i := 0; i < count; i++ {
		result[i] = userEntries[len(userEntries)-1-i]
	}
	return result
}
