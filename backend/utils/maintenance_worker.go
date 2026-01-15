package utils

import (
	"os"
	"strconv"

	"github.com/robfig/cron/v3"
)

type MaintenanceWorker struct {
	cron  *cron.Cron
	queue PersistentJobQueue
}

func NewMaintenanceWorker(queue PersistentJobQueue) *MaintenanceWorker {
	return &MaintenanceWorker{
		cron:  cron.New(),
		queue: queue,
	}
}

func (mw *MaintenanceWorker) Start() error {
	// CLEANUP_CRON_SCHEDULE: Cron expression for cleanup schedule
	// Format: "minute hour day month weekday"
	// Examples:
	//   "0 0 * * *"   - Daily at midnight (default)
	//   "0 */6 * * *" - Every 6 hours
	//   "0 2 * * *"   - Daily at 2 AM
	//   "0 0 * * 0"   - Weekly on Sunday
	schedule := os.Getenv("CLEANUP_CRON_SCHEDULE")
	if schedule == "" {
		schedule = "0 0 * * *"
	}

	// CLEANUP_RETENTION_DAYS: Number of days to keep completed/failed job logs
	// Default: 7 days
	// Set to higher value to keep logs longer, lower to cleanup more frequently
	retentionDaysStr := os.Getenv("CLEANUP_RETENTION_DAYS")
	retentionDays := 7
	if retentionDaysStr != "" {
		if days, err := strconv.Atoi(retentionDaysStr); err == nil {
			retentionDays = days
		}
	}

	_, err := mw.cron.AddFunc(schedule, func() {
		Logger.Infof("Starting job cleanup, retention: %d days", retentionDays)
		if err := mw.queue.CleanupOldJobs(retentionDays); err != nil {
			Logger.Errorf("Failed to cleanup old jobs: %v", err)
		} else {
			Logger.Infof("Job cleanup completed successfully")
		}
	})

	if err != nil {
		return err
	}

	mw.cron.Start()
	Logger.Infof("Maintenance worker started with schedule: %s", schedule)
	return nil
}

func (mw *MaintenanceWorker) Stop() {
	mw.cron.Stop()
}
