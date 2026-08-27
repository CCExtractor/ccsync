package utils

import (
	"path/filepath"
	"testing"
	"time"
)

func TestBoltJobQueue(t *testing.T) {
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "test_queue.db")

	queue, err := NewBoltJobQueue(dbPath)
	if err != nil {
		t.Fatalf("Failed to create queue: %v", err)
	}
	defer queue.Close()

	job := &PersistentJob{
		ID:        "test-job-1",
		Name:      "Test Job",
		State:     JobStatePending,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	err = queue.AddJob(job)
	if err != nil {
		t.Fatalf("Failed to add job: %v", err)
	}

	jobs, err := queue.GetPendingJobs()
	if err != nil {
		t.Fatalf("Failed to get pending jobs: %v", err)
	}

	if len(jobs) != 1 {
		t.Fatalf("Expected 1 job, got %d", len(jobs))
	}

	if jobs[0].ID != "test-job-1" {
		t.Fatalf("Expected job ID 'test-job-1', got '%s'", jobs[0].ID)
	}

	err = queue.UpdateJobState("test-job-1", JobStateInProgress, "")
	if err != nil {
		t.Fatalf("Failed to update job state to in-progress: %v", err)
	}

	err = queue.UpdateJobState("test-job-1", JobStateCompleted, "")
	if err != nil {
		t.Fatalf("Failed to update job state to completed: %v", err)
	}

	jobs, err = queue.GetPendingJobs()
	if err != nil {
		t.Fatalf("Failed to get pending jobs after update: %v", err)
	}

	if len(jobs) != 0 {
		t.Fatalf("Expected 0 pending jobs after completion, got %d", len(jobs))
	}
}

func TestJobCleanup(t *testing.T) {
	tmpDir := t.TempDir()
	dbPath := filepath.Join(tmpDir, "test_cleanup.db")

	queue, err := NewBoltJobQueue(dbPath)
	if err != nil {
		t.Fatalf("Failed to create queue: %v", err)
	}
	defer queue.Close()

	oldJob := &PersistentJob{
		ID:        "old-job",
		Name:      "Old Job",
		State:     JobStatePending,
		CreatedAt: time.Now().AddDate(0, 0, -10),
		UpdatedAt: time.Now().AddDate(0, 0, -10),
	}

	newJob := &PersistentJob{
		ID:        "new-job",
		Name:      "New Job",
		State:     JobStatePending,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	queue.AddJob(oldJob)
	queue.UpdateJobState("old-job", JobStateInProgress, "")
	queue.UpdateJobState("old-job", JobStateCompleted, "")

	queue.AddJob(newJob)
	queue.UpdateJobState("new-job", JobStateInProgress, "")
	queue.UpdateJobState("new-job", JobStateCompleted, "")

	err = queue.CleanupOldJobs(7)
	if err != nil {
		t.Fatalf("Failed to cleanup old jobs: %v", err)
	}
}
