package utils

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"go.etcd.io/bbolt"
)

type JobState string

const (
	JobStatePending    JobState = "pending"
	JobStateInProgress JobState = "inprogress"
	JobStateCompleted  JobState = "completed"
	JobStateFailed     JobState = "failed"
)

type PersistentJob struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	State     JobState  `json:"state"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Error     string    `json:"error,omitempty"`
	Data      []byte    `json:"data,omitempty"`
}

func (j *PersistentJob) ToJSON() ([]byte, error) {
	return json.Marshal(j)
}

func JobFromJSON(data []byte) (*PersistentJob, error) {
	var job PersistentJob
	err := json.Unmarshal(data, &job)
	return &job, err
}

type PersistentJobQueue interface {
	AddJob(job *PersistentJob) error
	GetPendingJobs() ([]*PersistentJob, error)
	UpdateJobState(id string, state JobState, errorMsg string) error
	CleanupOldJobs(retentionDays int) error
	Close() error
}

type BoltJobQueue struct {
	db *bbolt.DB
}

var (
	pendingBucket    = []byte("pending")
	inprogressBucket = []byte("inprogress")
	completedBucket  = []byte("completed")
	failedBucket     = []byte("failed")
)

func NewBoltJobQueue(dbPath string) (*BoltJobQueue, error) {
	if err := os.MkdirAll(filepath.Dir(dbPath), 0755); err != nil {
		return nil, fmt.Errorf("failed to create directory: %w", err)
	}

	db, err := bbolt.Open(dbPath, 0600, &bbolt.Options{Timeout: 1 * time.Second})
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	queue := &BoltJobQueue{db: db}
	if err := queue.initBuckets(); err != nil {
		db.Close()
		return nil, err
	}

	return queue, nil
}

func (q *BoltJobQueue) initBuckets() error {
	return q.db.Update(func(tx *bbolt.Tx) error {
		buckets := [][]byte{pendingBucket, inprogressBucket, completedBucket, failedBucket}
		for _, bucket := range buckets {
			if _, err := tx.CreateBucketIfNotExists(bucket); err != nil {
				return fmt.Errorf("failed to create bucket %s: %w", bucket, err)
			}
		}
		return nil
	})
}
func (q *BoltJobQueue) AddJob(job *PersistentJob) error {
	return q.db.Update(func(tx *bbolt.Tx) error {
		bucket := tx.Bucket(pendingBucket)
		data, err := job.ToJSON()
		if err != nil {
			return fmt.Errorf("failed to serialize job: %w", err)
		}
		return bucket.Put([]byte(job.ID), data)
	})
}

func (q *BoltJobQueue) GetPendingJobs() ([]*PersistentJob, error) {
	var jobs []*PersistentJob

	err := q.db.View(func(tx *bbolt.Tx) error {
		bucket := tx.Bucket(pendingBucket)
		return bucket.ForEach(func(k, v []byte) error {
			job, err := JobFromJSON(v)
			if err != nil {
				return err
			}
			jobs = append(jobs, job)
			return nil
		})
	})

	return jobs, err
}

func (q *BoltJobQueue) UpdateJobState(id string, state JobState, errorMsg string) error {
	return q.db.Update(func(tx *bbolt.Tx) error {
		var fromBucket, toBucket *bbolt.Bucket

		switch state {
		case JobStateInProgress:
			fromBucket = tx.Bucket(pendingBucket)
			toBucket = tx.Bucket(inprogressBucket)
		case JobStateCompleted:
			fromBucket = tx.Bucket(inprogressBucket)
			toBucket = tx.Bucket(completedBucket)
		case JobStateFailed:
			fromBucket = tx.Bucket(inprogressBucket)
			toBucket = tx.Bucket(failedBucket)
		default:
			return fmt.Errorf("invalid state transition to %s", state)
		}

		jobData := fromBucket.Get([]byte(id))
		if jobData == nil {
			return fmt.Errorf("job %s not found", id)
		}

		job, err := JobFromJSON(jobData)
		if err != nil {
			return err
		}

		job.State = state
		job.UpdatedAt = time.Now()
		if errorMsg != "" {
			job.Error = errorMsg
		}

		updatedData, err := job.ToJSON()
		if err != nil {
			return err
		}

		if err := toBucket.Put([]byte(id), updatedData); err != nil {
			return err
		}

		return fromBucket.Delete([]byte(id))
	})
}
func (q *BoltJobQueue) CleanupOldJobs(retentionDays int) error {
	cutoffTime := time.Now().AddDate(0, 0, -retentionDays)

	return q.db.Update(func(tx *bbolt.Tx) error {
		buckets := []*bbolt.Bucket{
			tx.Bucket(completedBucket),
			tx.Bucket(failedBucket),
		}

		for _, bucket := range buckets {
			var keysToDelete [][]byte

			bucket.ForEach(func(k, v []byte) error {
				job, err := JobFromJSON(v)
				if err != nil {
					return nil
				}

				if job.UpdatedAt.Before(cutoffTime) {
					keysToDelete = append(keysToDelete, append([]byte(nil), k...))
				}
				return nil
			})

			for _, key := range keysToDelete {
				bucket.Delete(key)
			}
		}

		return nil
	})
}

func (q *BoltJobQueue) Close() error {
	return q.db.Close()
}
