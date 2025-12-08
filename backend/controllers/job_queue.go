package controllers

import (
	"sync"

	"ccsync_backend/utils"
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
		utils.Logger.Infof("Executing job: %s", job.Name)

		go BroadcastJobStatus(JobStatus{
			Job:    job.Name,
			Status: "in-progress",
		})

		if err := job.Execute(); err != nil {
			utils.Logger.Errorf("Error executing job %s: %v", job.Name, err)

			go BroadcastJobStatus(JobStatus{
				Job:    job.Name,
				Status: "failure",
			})
		} else {
			utils.Logger.Infof("Success in executing job %s", job.Name)

			go BroadcastJobStatus(JobStatus{
				Job:    job.Name,
				Status: "success",
			})
		}

		q.wg.Done()
	}
}
