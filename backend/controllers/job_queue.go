package controllers

import (
	"fmt"
	"log"
	"sync"
)

// Job struct represents a Taskwarrior command job
type Job struct {
	Name    string
	Execute func() error
}

// JobQueue struct handles the sequential execution of jobs
type JobQueue struct {
	jobChannel chan Job
	wg         sync.WaitGroup
}

// NewJobQueue initializes the job queue
func NewJobQueue() *JobQueue {
	queue := &JobQueue{
		jobChannel: make(chan Job, 100), // Buffered channel for jobs
	}
	go queue.processJobs() // Start processing jobs
	return queue
}

// AddJob enqueues a job for execution
func (q *JobQueue) AddJob(job Job) {
	q.wg.Add(1)
	q.jobChannel <- job
	log.Printf("Added to the Queue: %s", job.Name)
}

// processJobs processes jobs sequentially
func (q *JobQueue) processJobs() {
	for job := range q.jobChannel {
		fmt.Printf("Executing job: %s", job.Name)
		if err := job.Execute(); err != nil {
			log.Printf("Error executing job %s: %v\n", job.Name, err)
		} else {
			log.Printf("Executed %s", job.Name)
		}
		q.wg.Done()
	}
}
