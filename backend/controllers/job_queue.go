package controllers

import (
	"os"
	"sync"
	"time"

	"ccsync_backend/utils"

	"github.com/google/uuid"
)

type Job struct {
	Name    string
	Execute func() error
}

type JobQueue struct {
	jobChannel      chan Job
	wg              sync.WaitGroup
	persistentQueue utils.PersistentJobQueue
}

func NewJobQueue() *JobQueue {
	dbPath := os.Getenv("QUEUE_DB_PATH")
	if dbPath == "" {
		dbPath = "/app/data/queue.db"
	}

	var persistentQueue utils.PersistentJobQueue
	if os.Getenv("GO_ENV") != "test" {
		pq, err := utils.NewBoltJobQueue(dbPath)
		if err != nil {
			utils.Logger.Errorf("Failed to initialize persistent queue: %v", err)
		} else {
			persistentQueue = pq
		}
	}

	queue := &JobQueue{
		jobChannel:      make(chan Job, 100),
		persistentQueue: persistentQueue,
	}

	if persistentQueue != nil {
		queue.restorePendingJobs()
	}

	go queue.processJobs()
	return queue
}

func (q *JobQueue) AddJob(job Job) {
	q.wg.Add(1)

	if q.persistentQueue != nil {
		persistentJob := &utils.PersistentJob{
			ID:        uuid.New().String(),
			Name:      job.Name,
			State:     utils.JobStatePending,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		if err := q.persistentQueue.AddJob(persistentJob); err != nil {
			utils.Logger.Errorf("Failed to persist job: %v", err)
		}
	}

	q.jobChannel <- job

	// notify job queued
	go BroadcastJobStatus(JobStatus{
		Job:    job.Name,
		Status: "queued",
	})
}

func (q *JobQueue) processJobs() {
	for job := range q.jobChannel {
		go BroadcastJobStatus(JobStatus{
			Job:    job.Name,
			Status: "in-progress",
		})

		if err := job.Execute(); err != nil {
			go BroadcastJobStatus(JobStatus{
				Job:    job.Name,
				Status: "failure",
			})
		} else {
			// utils.Logger.Infof("Success in executing job %s", job.Name)
			go BroadcastJobStatus(JobStatus{
				Job:    job.Name,
				Status: "success",
			})
		}

		q.wg.Done()
	}
}

func (q *JobQueue) restorePendingJobs() {
	if q.persistentQueue == nil {
		return
	}

	pendingJobs, err := q.persistentQueue.GetPendingJobs()
	if err != nil {
		utils.Logger.Errorf("Failed to restore pending jobs: %v", err)
		return
	}

	utils.Logger.Infof("Restoring %d pending jobs", len(pendingJobs))
	for _, persistentJob := range pendingJobs {
		job := Job{
			Name: persistentJob.Name,
			Execute: func() error {
				return nil
			},
		}
		q.AddJob(job)
	}
}
func (q *JobQueue) GetPersistentQueue() utils.PersistentJobQueue {
	return q.persistentQueue
}
