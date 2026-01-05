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
	schedule := os.Getenv("CLEANUP_CRON_SCHEDULE")
	if schedule == "" {
		schedule = "0 0 * * *"
	}

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
