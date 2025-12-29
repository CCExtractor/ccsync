package middleware

import (
	"encoding/gob"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gorilla/sessions"
)

func init() {
	gob.Register(map[string]interface{}{})
}

func TestRequireAuth_ValidSession(t *testing.T) {
	store := sessions.NewCookieStore([]byte("test-secret-key-32-bytes-long!"))
	middleware := RequireAuth(store)

	handler := middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userInfo, ok := GetUserFromContext(r)
		if !ok {
			t.Fatal("Expected user info in context")
		}
		if userInfo["email"] != "test@example.com" {
			t.Errorf("Expected email test@example.com, got %v", userInfo["email"])
		}
		w.WriteHeader(http.StatusOK)
	}))

	reqSetup := httptest.NewRequest("GET", "/test", nil)
	rrSetup := httptest.NewRecorder()

	session, _ := store.Get(reqSetup, "session-name")
	session.Values["user"] = map[string]interface{}{
		"email":             "test@example.com",
		"uuid":              "test-uuid",
		"encryption_secret": "test-secret",
	}
	err := session.Save(reqSetup, rrSetup)
	if err != nil {
		t.Fatalf("Failed to save session: %v", err)
	}

	req := httptest.NewRequest("GET", "/test", nil)
	for _, cookie := range rrSetup.Result().Cookies() {
		req.AddCookie(cookie)
	}

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", rr.Code)
	}
}

func TestRequireAuth_NoSession(t *testing.T) {
	store := sessions.NewCookieStore([]byte("test-secret-key-32-bytes-long!"))
	middleware := RequireAuth(store)

	handler := middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Fatal("Handler should not be called without valid session")
	}))

	req := httptest.NewRequest("GET", "/test", nil)
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("Expected status 401, got %d", rr.Code)
	}
}

func TestRequireAuth_InvalidSession(t *testing.T) {
	store := sessions.NewCookieStore([]byte("test-secret-key-32-bytes-long!"))
	middleware := RequireAuth(store)

	handler := middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Fatal("Handler should not be called with invalid session")
	}))

	reqSetup := httptest.NewRequest("GET", "/test", nil)
	rrSetup := httptest.NewRecorder()

	session, _ := store.Get(reqSetup, "session-name")
	session.Values["user"] = "invalid-data"
	session.Save(reqSetup, rrSetup)

	req := httptest.NewRequest("GET", "/test", nil)
	for _, cookie := range rrSetup.Result().Cookies() {
		req.AddCookie(cookie)
	}

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("Expected status 401, got %d", rr.Code)
	}
}

func TestGetUserFromContext_ValidContext(t *testing.T) {
	store := sessions.NewCookieStore([]byte("test-secret-key-32-bytes-long!"))
	middleware := RequireAuth(store)

	handler := middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userInfo, ok := GetUserFromContext(r)
		if !ok {
			t.Fatal("Expected user info in context")
		}
		if userInfo["email"] != "test@example.com" {
			t.Errorf("Expected email test@example.com, got %v", userInfo["email"])
		}
		if userInfo["uuid"] != "test-uuid" {
			t.Errorf("Expected uuid test-uuid, got %v", userInfo["uuid"])
		}
		w.WriteHeader(http.StatusOK)
	}))

	reqSetup := httptest.NewRequest("GET", "/test", nil)
	rrSetup := httptest.NewRecorder()

	session, _ := store.Get(reqSetup, "session-name")
	session.Values["user"] = map[string]interface{}{
		"email":             "test@example.com",
		"uuid":              "test-uuid",
		"encryption_secret": "test-secret",
	}
	err := session.Save(reqSetup, rrSetup)
	if err != nil {
		t.Fatalf("Failed to save session: %v", err)
	}

	req := httptest.NewRequest("GET", "/test", nil)
	for _, cookie := range rrSetup.Result().Cookies() {
		req.AddCookie(cookie)
	}

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", rr.Code)
	}
}

func TestGetUserFromContext_NoContext(t *testing.T) {
	req := httptest.NewRequest("GET", "/test", nil)

	userInfo, ok := GetUserFromContext(req)
	if ok {
		t.Error("Expected no user info in context")
	}
	if userInfo != nil {
		t.Error("Expected nil user info")
	}
}
