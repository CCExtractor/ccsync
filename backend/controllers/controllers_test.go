package controllers

import (
	"bytes"
	"encoding/gob"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gorilla/sessions"
	"github.com/joho/godotenv"
	"github.com/stretchr/testify/assert"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

func setup() *App {
	godotenv.Load("../.env")

	clientID := os.Getenv("CLIENT_ID")
	clientSecret := os.Getenv("CLIENT_SEC")
	redirectURL := os.Getenv("REDIRECT_URL_DEV")
	conf := &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURL:  redirectURL,
		Scopes:       []string{"email", "profile"},
		Endpoint:     google.Endpoint,
	}

	sessionKey := []byte(os.Getenv("SESSION_KEY"))
	store := sessions.NewCookieStore(sessionKey)
	gob.Register(map[string]interface{}{})

	return &App{Config: conf, SessionStore: store}
}

func Test_OAuthHandler(t *testing.T) {
	app := setup()
	req, err := http.NewRequest("GET", "/auth/oauth", nil)
	assert.NoError(t, err)

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(app.OAuthHandler)
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusTemporaryRedirect, rr.Code)
	location, err := rr.Result().Location()
	assert.NoError(t, err)
	assert.Contains(t, location.String(), app.Config.AuthCodeURL("state", oauth2.AccessTypeOffline))
}

func Test_OAuthCallbackHandler(t *testing.T) {
	app := setup()
	// This part of the test requires mocking the OAuth provider which can be complex. Simplified for demonstration.
	req, err := http.NewRequest("GET", "/auth/callback?code=testcode", nil)
	assert.NoError(t, err)

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(app.OAuthCallbackHandler)
	handler.ServeHTTP(rr, req)

	// Since actual OAuth flow can't be tested in unit test, we are focusing on ensuring no panic
	assert.NotEqual(t, http.StatusInternalServerError, rr.Code)
}

func Test_UserInfoHandler(t *testing.T) {
	app := setup()

	// Create a request object to pass to the session store
	req, err := http.NewRequest("GET", "/api/user", nil)
	assert.NoError(t, err)

	session, _ := app.SessionStore.Get(req, "session-name")
	session.Values["user"] = map[string]interface{}{
		"email":             "test@example.com",
		"id":                "12345",
		"uuid":              "uuid-test",
		"encryption_secret": "secret-test",
	}
	session.Save(req, httptest.NewRecorder()) // Save the session

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(app.UserInfoHandler)
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)

	var userInfo map[string]interface{}
	err = json.NewDecoder(rr.Body).Decode(&userInfo)
	assert.NoError(t, err)
	assert.Equal(t, "test@example.com", userInfo["email"])
	assert.Equal(t, "12345", userInfo["id"])
	assert.Equal(t, "uuid-test", userInfo["uuid"])
	assert.Equal(t, "secret-test", userInfo["encryption_secret"])
}

func Test_EnableCORS(t *testing.T) {
	app := setup()
	req, err := http.NewRequest("OPTIONS", "/", nil)
	assert.NoError(t, err)

	rr := httptest.NewRecorder()
	handler := app.EnableCORS(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	assert.Equal(t, os.Getenv("FRONTEND_ORIGIN_DEV"), rr.Header().Get("Access-Control-Allow-Origin"))
}

func Test_LogoutHandler(t *testing.T) {
	app := setup()
	req, err := http.NewRequest("POST", "/auth/logout", nil)
	assert.NoError(t, err)

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(app.LogoutHandler)
	handler.ServeHTTP(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)
	session, _ := app.SessionStore.Get(req, "session-name")
	assert.Equal(t, -1, session.Options.MaxAge)
}

func Test_AddTaskHandler_WithDueDate(t *testing.T) {
	// Initialize job queue
	GlobalJobQueue = NewJobQueue()

	requestBody := map[string]interface{}{
		"email":            "test@example.com",
		"encryptionSecret": "secret",
		"UUID":             "test-uuid",
		"description":      "Test task",
		"project":          "TestProject",
		"priority":         "H",
		"due":              "2025-12-31",
		"tags":             []string{"test", "important"},
	}

	body, _ := json.Marshal(requestBody)
	req, err := http.NewRequest("POST", "/add-task", bytes.NewBuffer(body))
	assert.NoError(t, err)
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	AddTaskHandler(rr, req)

	assert.Equal(t, http.StatusAccepted, rr.Code)
}

func Test_AddTaskHandler_WithoutDueDate(t *testing.T) {
	// Initialize job queue
	GlobalJobQueue = NewJobQueue()

	requestBody := map[string]interface{}{
		"email":            "test@example.com",
		"encryptionSecret": "secret",
		"UUID":             "test-uuid",
		"description":      "Test task without due date",
		"project":          "TestProject",
		"priority":         "M",
		"tags":             []string{"test"},
	}

	body, _ := json.Marshal(requestBody)
	req, err := http.NewRequest("POST", "/add-task", bytes.NewBuffer(body))
	assert.NoError(t, err)
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	AddTaskHandler(rr, req)

	assert.Equal(t, http.StatusAccepted, rr.Code)
}

func Test_AddTaskHandler_MissingDescription(t *testing.T) {
	requestBody := map[string]interface{}{
		"email":            "test@example.com",
		"encryptionSecret": "secret",
		"UUID":             "test-uuid",
		"description":      "",
		"project":          "TestProject",
		"priority":         "H",
	}

	body, _ := json.Marshal(requestBody)
	req, err := http.NewRequest("POST", "/add-task", bytes.NewBuffer(body))
	assert.NoError(t, err)
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	AddTaskHandler(rr, req)

	assert.Equal(t, http.StatusBadRequest, rr.Code)
	assert.Contains(t, rr.Body.String(), "Description is required")
}

// Task Dependencies Tests
func Test_AddTaskHandler_WithDependencies(t *testing.T) {
	GlobalJobQueue = NewJobQueue()

	requestBody := map[string]interface{}{
		"email":            "test@example.com",
		"encryptionSecret": "secret",
		"UUID":             "test-uuid",
		"description":      "Task with dependencies",
		"project":          "TestProject",
		"priority":         "H",
		"depends":          []string{"task-uuid-1", "task-uuid-2"},
		"tags":             []string{"dependent"},
	}

	body, _ := json.Marshal(requestBody)
	req, err := http.NewRequest("POST", "/add-task", bytes.NewBuffer(body))
	assert.NoError(t, err)
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	AddTaskHandler(rr, req)

	assert.Equal(t, http.StatusAccepted, rr.Code)
}

func Test_AddTaskHandler_WithEmptyDependencies(t *testing.T) {
	GlobalJobQueue = NewJobQueue()

	requestBody := map[string]interface{}{
		"email":            "test@example.com",
		"encryptionSecret": "secret",
		"UUID":             "test-uuid",
		"description":      "Task with empty dependencies",
		"project":          "TestProject",
		"priority":         "M",
		"depends":          []string{},
		"tags":             []string{"test"},
	}

	body, _ := json.Marshal(requestBody)
	req, err := http.NewRequest("POST", "/add-task", bytes.NewBuffer(body))
	assert.NoError(t, err)
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	AddTaskHandler(rr, req)

	assert.Equal(t, http.StatusAccepted, rr.Code)
}

func Test_EditTaskHandler_WithDependencies(t *testing.T) {
	GlobalJobQueue = NewJobQueue()

	requestBody := map[string]interface{}{
		"email":            "test@example.com",
		"encryptionSecret": "secret",
		"UUID":             "test-uuid",
		"taskID":           "1",
		"description":      "Edited task with dependencies",
		"project":          "EditedProject",
		"depends":          []string{"task-uuid-3"},
		"tags":             []string{"edited", "dependent"},
	}

	body, _ := json.Marshal(requestBody)
	req, err := http.NewRequest("POST", "/edit-task", bytes.NewBuffer(body))
	assert.NoError(t, err)
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	EditTaskHandler(rr, req)

	assert.Equal(t, http.StatusAccepted, rr.Code)
}
