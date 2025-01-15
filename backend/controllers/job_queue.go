package controllers

import (
	"fmt"
	"log"
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
		fmt.Printf("Executing job: %s\n", job.Name)

		go BroadcastJobStatus(JobStatus{
			Job:    job.Name,
			Status: "in-progress",
		})

		if err := job.Execute(); err != nil {
			log.Printf("Error executing job %s: %v\n", job.Name, err)

			go BroadcastJobStatus(JobStatus{
				Job:    job.Name,
				Status: "failure",
			})
		} else {
			log.Printf("Success in executing job %s\n", job.Name)

			go BroadcastJobStatus(JobStatus{
				Job:    job.Name,
				Status: "success",
			})
		}

		q.wg.Done()
	}
}
