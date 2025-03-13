package controllers

import (
	"bytes"
	"ccsync_backend/models"
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

	if GlobalJobQueue == nil {
		GlobalJobQueue = NewJobQueue()
	}

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

func Test_AddTaskWithRecurrence(t *testing.T) {
	tests := []struct {
		name          string
		requestBody   models.AddTaskRequestBody
		expectedCode  int
		expectedError bool
	}{
		{
			name: "Valid Daily Recurring Task",
			requestBody: models.AddTaskRequestBody{
				Email:            "test@example.com",
				EncryptionSecret: "test-secret",
				UUID:             "test-uuid",
				Description:      "Daily Team Standup",
				Project:          "Meetings",
				Priority:         "M",
				DueDate:          "2024-03-20",
				Tags:             []string{"meeting", "team"},
				Recur:            &[]string{"daily"}[0],
				Until:            &[]string{"2024-06-20"}[0],
			},
			expectedCode:  http.StatusAccepted,
			expectedError: false,
		},
		{
			name: "Valid Weekly Recurring Task",
			requestBody: models.AddTaskRequestBody{
				Email:            "test@example.com",
				EncryptionSecret: "test-secret",
				UUID:             "test-uuid",
				Description:      "Weekly Progress Report",
				Project:          "Reports",
				Priority:         "H",
				DueDate:          "2024-03-22",
				Tags:             []string{"report"},
				Recur:            &[]string{"weekly"}[0],
			},
			expectedCode:  http.StatusAccepted,
			expectedError: false,
		},
		{
			name: "Invalid Recurrence Format",
			requestBody: models.AddTaskRequestBody{
				Email:            "test@example.com",
				EncryptionSecret: "test-secret",
				UUID:             "test-uuid",
				Description:      "Invalid Recurring Task",
				DueDate:          "2024-03-20",
				Recur:            &[]string{"bi-weekly"}[0], // Invalid recurrence
			},
			expectedCode:  http.StatusBadRequest,
			expectedError: true,
		},
		{
			name: "Missing Due Date with Recurrence",
			requestBody: models.AddTaskRequestBody{
				Email:            "test@example.com",
				EncryptionSecret: "test-secret",
				UUID:             "test-uuid",
				Description:      "Task Without Due Date",
				Recur:            &[]string{"monthly"}[0],
				// Missing DueDate
			},
			expectedCode:  http.StatusBadRequest,
			expectedError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			setup() // Initialize the app and job queue
			jsonBody, err := json.Marshal(tt.requestBody)
			assert.NoError(t, err)

			req, err := http.NewRequest("POST", "/api/tasks/add", bytes.NewBuffer(jsonBody))
			assert.NoError(t, err)
			req.Header.Set("Content-Type", "application/json")

			rr := httptest.NewRecorder()
			handler := http.HandlerFunc(AddTaskHandler)
			handler.ServeHTTP(rr, req)

			assert.Equal(t, tt.expectedCode, rr.Code)

			if tt.expectedError {
				assert.NotEmpty(t, rr.Body.String())
			}
		})
	}
}

func Test_ModifyRecurringTask(t *testing.T) {
	tests := []struct {
		name          string
		requestBody   models.ModifyTaskRequestBody
		expectedCode  int
		expectedError bool
	}{
		{
			name: "Update Recurrence Pattern",
			requestBody: models.ModifyTaskRequestBody{
				Email:            "test@example.com",
				EncryptionSecret: "test-secret",
				UUID:             "test-uuid",
				TaskID:           "task-123",
				Description:      "Updated Recurring Task",
				Project:          "Meetings",
				Priority:         "H",
				Due:              "2024-03-25",
				Recur:            &[]string{"monthly"}[0],
				Until:            &[]string{"2024-12-31"}[0],
			},
			expectedCode:  http.StatusAccepted,
			expectedError: false,
		},
		{
			name: "Remove Recurrence",
			requestBody: models.ModifyTaskRequestBody{
				Email:            "test@example.com",
				EncryptionSecret: "test-secret",
				UUID:             "test-uuid",
				TaskID:           "task-123",
				Description:      "No Longer Recurring",
				Due:              "2024-03-25",
				Recur:            nil, // nil removes recurrence
			},
			expectedCode:  http.StatusAccepted,
			expectedError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			setup() // Initialize the app and job queue
			jsonBody, err := json.Marshal(tt.requestBody)
			assert.NoError(t, err)

			req, err := http.NewRequest("POST", "/api/tasks/modify", bytes.NewBuffer(jsonBody))
			assert.NoError(t, err)
			req.Header.Set("Content-Type", "application/json")

			rr := httptest.NewRecorder()
			handler := http.HandlerFunc(ModifyTaskHandler)
			handler.ServeHTTP(rr, req)

			assert.Equal(t, tt.expectedCode, rr.Code)

			if tt.expectedError {
				assert.NotEmpty(t, rr.Body.String())
			}
		})
	}
}

// Cleanup tests(that uses job queue)
func teardown(t *testing.T) {
	if GlobalJobQueue != nil {
		GlobalJobQueue = nil
	}
}