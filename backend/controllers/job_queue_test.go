package controllers

import (
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_JobQueue_ExecutesSequentially(t *testing.T) {
	q := NewJobQueue()

	var mu sync.Mutex
	var order []int
	startedSecond := make(chan struct{})
	releaseFirst := make(chan struct{})
	done := make(chan struct{}, 2)

	q.AddJob(Job{
		Name: "first",
		Execute: func() error {
			mu.Lock()
			order = append(order, 1)
			mu.Unlock()
			close(startedSecond)
			<-releaseFirst
			done <- struct{}{}
			return nil
		},
	})
	q.AddJob(Job{
		Name: "second",
		Execute: func() error {
			mu.Lock()
			order = append(order, 2)
			mu.Unlock()
			done <- struct{}{}
			return nil
		},
	})

	select {
	case <-startedSecond:
	case <-time.After(2 * time.Second):
		t.Fatal("first job did not start")
	}

	// While the first job is held open, the second must not have run yet.
	mu.Lock()
	require.Equal(t, []int{1}, order)
	mu.Unlock()

	close(releaseFirst)

	for i := 0; i < 2; i++ {
		select {
		case <-done:
		case <-time.After(2 * time.Second):
			t.Fatal("jobs did not finish")
		}
	}

	mu.Lock()
	defer mu.Unlock()
	assert.Equal(t, []int{1, 2}, order)
}
