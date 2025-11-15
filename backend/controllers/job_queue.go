package controllers

import (
	"ccsync_backend/utils/logger"
	"sync"
)

type Job struct {
	Name    string
	Execute func() error
}

type JobQueue struct {
	jobChannel chan Job
	wg         sync.WaitGroup
}

func NewJobQueue() *JobQueue {
	queue := &JobQueue{
		jobChannel: make(chan Job, 100),
	}
	go queue.processJobs()
	return queue
}

func (q *JobQueue) AddJob(job Job) {
	q.wg.Add(1)
	q.jobChannel <- job

	// notify job queued
	go BroadcastJobStatus(JobStatus{
		Job:    job.Name,
		Status: "queued",
	})
}

func (q *JobQueue) processJobs() {
	for job := range q.jobChannel {
		logger.Info("Executing job", "job", job.Name)

		go BroadcastJobStatus(JobStatus{
			Job:    job.Name,
			Status: "in-progress",
		})

		if err := job.Execute(); err != nil {
			logger.Error("Job execution failed", "job", job.Name, "error", err)

			go BroadcastJobStatus(JobStatus{
				Job:    job.Name,
				Status: "failure",
			})
		} else {
			logger.Info("Job completed successfully", "job", job.Name)

			go BroadcastJobStatus(JobStatus{
				Job:    job.Name,
				Status: "success",
			})
		}

		q.wg.Done()
	}
}
