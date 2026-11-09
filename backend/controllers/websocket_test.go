package controllers

import (
	"encoding/gob"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/sessions"
	"github.com/gorilla/websocket"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func resetWebSocketClients(t *testing.T) {
	t.Helper()
	clientsMu.Lock()
	prev := clients
	clients = make(map[*websocket.Conn]string)
	clientsMu.Unlock()
	t.Cleanup(func() {
		clientsMu.Lock()
		for c := range clients {
			_ = c.Close()
		}
		clients = prev
		clientsMu.Unlock()
	})
}

// startIDTaggedWSServer upgrades connections and registers them in `clients`
// using the `id` query parameter (same map deliverJobStatus reads).
func startIDTaggedWSServer(t *testing.T) *httptest.Server {
	t.Helper()
	up := websocket.Upgrader{CheckOrigin: func(r *http.Request) bool { return true }}
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ws, err := up.Upgrade(w, r, nil)
		if err != nil {
			return
		}
		id := r.URL.Query().Get("id")
		clientsMu.Lock()
		clients[ws] = id
		clientsMu.Unlock()
		for {
			if _, _, err := ws.ReadMessage(); err != nil {
				clientsMu.Lock()
				delete(clients, ws)
				clientsMu.Unlock()
				_ = ws.Close()
				return
			}
		}
	}))
	t.Cleanup(server.Close)
	return server
}

func dialWS(t *testing.T, server *httptest.Server, id string) *websocket.Conn {
	t.Helper()
	wsURL := "ws" + strings.TrimPrefix(server.URL, "http")
	conn, _, err := websocket.DefaultDialer.Dial(wsURL+"?id="+id, nil)
	require.NoError(t, err)
	t.Cleanup(func() { _ = conn.Close() })
	return conn
}

func waitForClientCount(t *testing.T, n int) {
	t.Helper()
	require.Eventually(t, func() bool {
		clientsMu.RLock()
		defer clientsMu.RUnlock()
		return len(clients) == n
	}, time.Second, 10*time.Millisecond)
}

func readJobStatus(t *testing.T, conn *websocket.Conn, timeout time.Duration) (JobStatus, error) {
	t.Helper()
	_ = conn.SetReadDeadline(time.Now().Add(timeout))
	var got JobStatus
	err := conn.ReadJSON(&got)
	return got, err
}

func assertNoJobStatus(t *testing.T, conn *websocket.Conn, msg string) {
	t.Helper()
	_, err := readJobStatus(t, conn, 200*time.Millisecond)
	assert.Error(t, err, msg)
}

func Test_deliverJobStatus_OnlyMatchingClientReceivesEvent(t *testing.T) {
	resetWebSocketClients(t)
	server := startIDTaggedWSServer(t)
	connA := dialWS(t, server, "user-a")
	connB := dialWS(t, server, "user-b")
	waitForClientCount(t, 2)

	deliverJobStatus(JobStatus{
		Job:      "Add Task",
		Status:   "success",
		ClientID: "user-a",
	})

	got, err := readJobStatus(t, connA, 2*time.Second)
	require.NoError(t, err)
	assert.Equal(t, "Add Task", got.Job)
	assert.Equal(t, "success", got.Status)
	assert.Equal(t, "user-a", got.ClientID)

	// Reverse direction: B's event must not appear on A's socket.
	// Do not timeout-read connB first: gorilla treats that error as permanent.
	deliverJobStatus(JobStatus{
		Job:      "Delete Task",
		Status:   "success",
		ClientID: "user-b",
	})

	got, err = readJobStatus(t, connB, 2*time.Second)
	require.NoError(t, err)
	assert.Equal(t, "Delete Task", got.Job)
	assert.Equal(t, "success", got.Status)
	assert.Equal(t, "user-b", got.ClientID)
	assertNoJobStatus(t, connA, "user-a must not receive user-b's job status")
}

func Test_deliverJobStatus_EmptyClientIDDeliversToNoSocket(t *testing.T) {
	resetWebSocketClients(t)
	server := startIDTaggedWSServer(t)
	connA := dialWS(t, server, "user-a")
	connB := dialWS(t, server, "user-b")
	waitForClientCount(t, 2)

	deliverJobStatus(JobStatus{
		Job:      "Get Tasks",
		Status:   "success",
		ClientID: "",
	})

	assertNoJobStatus(t, connA, "empty ClientID must not be delivered to user-a")
	assertNoJobStatus(t, connB, "empty ClientID must not be delivered to user-b")
}

func Test_deliverJobStatus_SameUserMultipleConnectionsBothReceive(t *testing.T) {
	resetWebSocketClients(t)
	server := startIDTaggedWSServer(t)
	tab1 := dialWS(t, server, "user-a")
	tab2 := dialWS(t, server, "user-a")
	waitForClientCount(t, 2)

	deliverJobStatus(JobStatus{
		Job:      "Edit Task",
		Status:   "success",
		ClientID: "user-a",
	})

	got1, err := readJobStatus(t, tab1, 2*time.Second)
	require.NoError(t, err)
	got2, err := readJobStatus(t, tab2, 2*time.Second)
	require.NoError(t, err)

	assert.Equal(t, "Edit Task", got1.Job)
	assert.Equal(t, "success", got1.Status)
	assert.Equal(t, "user-a", got1.ClientID)
	assert.Equal(t, got1, got2)
}

func Test_deliverJobStatus_FailureOnlyReachesOwningUser(t *testing.T) {
	resetWebSocketClients(t)
	server := startIDTaggedWSServer(t)
	connA := dialWS(t, server, "user-a")
	connB := dialWS(t, server, "user-b")
	waitForClientCount(t, 2)

	deliverJobStatus(JobStatus{
		Job:      "Add Task",
		Status:   "failure",
		ClientID: "user-a",
	})

	got, err := readJobStatus(t, connA, 2*time.Second)
	require.NoError(t, err)
	assert.Equal(t, "Add Task", got.Job)
	assert.Equal(t, "failure", got.Status)
	assert.Equal(t, "user-a", got.ClientID)
	assertNoJobStatus(t, connB, "user-b must not receive user-a's failure event")
}

func Test_AuthenticatedWebSocketHandler_UsesSessionUUIDNotQueryClientID(t *testing.T) {
	resetWebSocketClients(t)

	gob.Register(map[string]interface{}{})
	store := sessions.NewCookieStore([]byte("test-session-key-32bytes-long!!"))
	handler := AuthenticatedWebSocketHandler(store)

	// Establish a session cookie the same way the OAuth callback would.
	seedReq := httptest.NewRequest(http.MethodGet, "/", nil)
	seedRec := httptest.NewRecorder()
	session, err := store.Get(seedReq, "session-name")
	require.NoError(t, err)
	session.Values["user"] = map[string]interface{}{
		"email": "a@example.com",
		"id":    "1",
		"uuid":  "session-uuid-a",
	}
	require.NoError(t, session.Save(seedReq, seedRec))
	setCookie := seedRec.Result().Header.Get("Set-Cookie")
	require.NotEmpty(t, setCookie)

	server := httptest.NewServer(handler)
	defer server.Close()

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http")
	header := http.Header{}
	header.Add("Cookie", setCookie)
	// Query claims a different user; session UUID must win.
	conn, resp, err := websocket.DefaultDialer.Dial(wsURL+"?clientID=attacker-uuid", header)
	require.NoError(t, err)
	defer conn.Close()
	require.Equal(t, http.StatusSwitchingProtocols, resp.StatusCode)

	require.Eventually(t, func() bool {
		clientsMu.RLock()
		defer clientsMu.RUnlock()
		for _, id := range clients {
			if id == "session-uuid-a" {
				return true
			}
		}
		return false
	}, time.Second, 10*time.Millisecond)

	clientsMu.RLock()
	defer clientsMu.RUnlock()
	for _, id := range clients {
		assert.Equal(t, "session-uuid-a", id)
		assert.NotEqual(t, "attacker-uuid", id)
	}
}

func Test_AddJob_IncludesClientIDInBroadcast(t *testing.T) {
	resetWebSocketClients(t)

	received := make(chan JobStatus, 16)
	stop := make(chan struct{})
	done := make(chan struct{})
	go func() {
		defer close(done)
		for {
			select {
			case status := <-broadcast:
				select {
				case received <- status:
				default:
				}
			case <-stop:
				return
			}
		}
	}()
	defer func() {
		close(stop)
		<-done
	}()

	q := NewJobQueue()
	q.AddJob(Job{
		Name:     "Add Task",
		ClientID: "user-a",
		Execute:  func() error { return nil },
	})

	var sawQueued, sawSuccess bool
	timeout := time.After(2 * time.Second)
	for !(sawQueued && sawSuccess) {
		select {
		case status := <-received:
			// Other controller tests may also emit on the shared broadcast channel.
			if status.ClientID != "user-a" || status.Job != "Add Task" {
				continue
			}
			if status.Status == "queued" {
				sawQueued = true
			}
			if status.Status == "success" {
				sawSuccess = true
			}
		case <-timeout:
			t.Fatal("timed out waiting for job status events with ClientID")
		}
	}
}
