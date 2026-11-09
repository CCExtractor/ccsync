package controllers

import (
	"ccsync_backend/models"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func withMockFetch(t *testing.T, fn func(email, encryptionSecret, origin, UUID string) ([]models.Task, error)) {
	t.Helper()
	orig := fetchTasksFromTaskwarrior
	fetchTasksFromTaskwarrior = fn
	t.Cleanup(func() {
		fetchTasksFromTaskwarrior = orig
	})
}

func Test_TasksHandler_MissingHeaders(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/tasks", nil)
	rr := httptest.NewRecorder()
	TasksHandler(rr, req)
	assert.Equal(t, http.StatusBadRequest, rr.Code)
}

func Test_TasksHandler_MethodNotAllowed(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/tasks", nil)
	req.Header.Set("X-User-Email", "a@b.com")
	req.Header.Set("X-Encryption-Secret", "secret")
	req.Header.Set("X-User-UUID", "uuid")
	rr := httptest.NewRecorder()
	TasksHandler(rr, req)
	assert.Equal(t, http.StatusMethodNotAllowed, rr.Code)
}

func Test_TasksHandler_ReturnsOwnFetchResult(t *testing.T) {
	GlobalJobQueue = NewJobQueue()
	withMockFetch(t, func(email, encryptionSecret, origin, UUID string) ([]models.Task, error) {
		return []models.Task{{
			UUID:        UUID,
			Description: email,
		}}, nil
	})

	var wg sync.WaitGroup
	results := make([][]models.Task, 2)
	errs := make([]error, 2)

	for i, uuid := range []string{"user-a", "user-b"} {
		wg.Add(1)
		go func(i int, uuid string) {
			defer wg.Done()
			req := httptest.NewRequest(http.MethodGet, "/tasks", nil)
			req.Header.Set("X-User-Email", uuid+"@example.com")
			req.Header.Set("X-Encryption-Secret", "secret")
			req.Header.Set("X-User-UUID", uuid)
			rr := httptest.NewRecorder()
			TasksHandler(rr, req)
			if rr.Code != http.StatusOK {
				errs[i] = fmt.Errorf("status %d: %s", rr.Code, rr.Body.String())
				return
			}
			var tasks []models.Task
			if err := json.Unmarshal(rr.Body.Bytes(), &tasks); err != nil {
				errs[i] = err
				return
			}
			results[i] = tasks
		}(i, uuid)
	}
	wg.Wait()

	require.NoError(t, errs[0])
	require.NoError(t, errs[1])
	require.Len(t, results[0], 1)
	require.Len(t, results[1], 1)
	assert.Equal(t, "user-a", results[0][0].UUID)
	assert.Equal(t, "user-b", results[1][0].UUID)
	assert.Equal(t, "user-a@example.com", results[0][0].Description)
	assert.Equal(t, "user-b@example.com", results[1][0].Description)
}

func Test_TasksHandler_EmptyListReturnsJSONArray(t *testing.T) {
	GlobalJobQueue = NewJobQueue()
	withMockFetch(t, func(email, encryptionSecret, origin, UUID string) ([]models.Task, error) {
		return nil, nil
	})

	req := httptest.NewRequest(http.MethodGet, "/tasks", nil)
	req.Header.Set("X-User-Email", "a@b.com")
	req.Header.Set("X-Encryption-Secret", "secret")
	req.Header.Set("X-User-UUID", "uuid")
	rr := httptest.NewRecorder()
	TasksHandler(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Equal(t, "application/json", rr.Header().Get("Content-Type"))
	assert.JSONEq(t, "[]", rr.Body.String())
}

func Test_TasksHandler_FetchFailureReturns500(t *testing.T) {
	GlobalJobQueue = NewJobQueue()
	withMockFetch(t, func(email, encryptionSecret, origin, UUID string) ([]models.Task, error) {
		return nil, errors.New("sync failed")
	})

	req := httptest.NewRequest(http.MethodGet, "/tasks", nil)
	req.Header.Set("X-User-Email", "a@b.com")
	req.Header.Set("X-Encryption-Secret", "secret")
	req.Header.Set("X-User-UUID", "uuid")
	rr := httptest.NewRecorder()
	TasksHandler(rr, req)

	assert.Equal(t, http.StatusInternalServerError, rr.Code)
	assert.Contains(t, rr.Body.String(), "Failed to fetch tasks at backend")
}

func Test_TasksHandler_FetchPanicReturns500AndKeepsQueueUsable(t *testing.T) {
	GlobalJobQueue = NewJobQueue()
	withMockFetch(t, func(email, encryptionSecret, origin, UUID string) ([]models.Task, error) {
		panic("simulated fetch panic")
	})

	handlerDone := make(chan *httptest.ResponseRecorder, 1)
	go func() {
		req := httptest.NewRequest(http.MethodGet, "/tasks", nil)
		req.Header.Set("X-User-Email", "a@b.com")
		req.Header.Set("X-Encryption-Secret", "secret")
		req.Header.Set("X-User-UUID", "uuid")
		rr := httptest.NewRecorder()
		TasksHandler(rr, req)
		handlerDone <- rr
	}()

	var rr *httptest.ResponseRecorder
	select {
	case rr = <-handlerDone:
	case <-time.After(2 * time.Second):
		t.Fatal("handler did not complete after fetch panic")
	}

	assert.Equal(t, http.StatusInternalServerError, rr.Code)
	assert.Contains(t, rr.Body.String(), "Failed to fetch tasks at backend")

	followUpDone := make(chan struct{})
	GlobalJobQueue.AddJob(Job{
		Name: "follow-up-after-panic",
		Execute: func() error {
			close(followUpDone)
			return nil
		},
	})

	select {
	case <-followUpDone:
	case <-time.After(2 * time.Second):
		t.Fatal("queue worker blocked after fetch panic")
	}
}

func Test_TasksHandler_ClientDisconnectDoesNotBlockQueue(t *testing.T) {
	GlobalJobQueue = NewJobQueue()

	fetchStarted := make(chan struct{})
	fetchRelease := make(chan struct{})
	withMockFetch(t, func(email, encryptionSecret, origin, UUID string) ([]models.Task, error) {
		close(fetchStarted)
		<-fetchRelease
		return []models.Task{}, nil
	})

	ctx, cancel := context.WithCancel(context.Background())
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, "/tasks", nil)
	require.NoError(t, err)
	req.Header.Set("X-User-Email", "a@b.com")
	req.Header.Set("X-Encryption-Secret", "secret")
	req.Header.Set("X-User-UUID", "uuid")

	handlerDone := make(chan struct{})
	go func() {
		defer close(handlerDone)
		rr := httptest.NewRecorder()
		TasksHandler(rr, req)
	}()

	select {
	case <-fetchStarted:
	case <-time.After(2 * time.Second):
		t.Fatal("fetch job did not start")
	}

	cancel()

	select {
	case <-handlerDone:
	case <-time.After(2 * time.Second):
		t.Fatal("handler did not return after client cancel")
	}

	// A subsequent job must still be able to run (queue worker not stuck).
	followUpDone := make(chan struct{})
	GlobalJobQueue.AddJob(Job{
		Name: "follow-up",
		Execute: func() error {
			close(followUpDone)
			return nil
		},
	})

	close(fetchRelease)

	select {
	case <-followUpDone:
	case <-time.After(2 * time.Second):
		t.Fatal("queue worker blocked after client disconnect")
	}
}
