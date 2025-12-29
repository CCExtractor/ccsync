package controllers

import (
	"context"
	"net/http/httptest"
	"testing"
)

func TestValidateUserCredentials_MatchingCredentials(t *testing.T) {
	req := httptest.NewRequest("GET", "/test", nil)
	ctx := context.WithValue(req.Context(), "user", map[string]interface{}{
		"email":             "test@example.com",
		"uuid":              "test-uuid-123",
		"encryption_secret": "test-secret",
	})
	req = req.WithContext(ctx)

	err := ValidateUserCredentials(req, "test@example.com", "test-uuid-123")
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}
}

func TestValidateUserCredentials_MismatchedEmail(t *testing.T) {
	req := httptest.NewRequest("GET", "/test", nil)
	ctx := context.WithValue(req.Context(), "user", map[string]interface{}{
		"email":             "test@example.com",
		"uuid":              "test-uuid-123",
		"encryption_secret": "test-secret",
	})
	req = req.WithContext(ctx)

	err := ValidateUserCredentials(req, "wrong@example.com", "test-uuid-123")
	if err == nil {
		t.Error("Expected error for mismatched email")
	}
	if err.Error() != "credentials do not match authenticated user" {
		t.Errorf("Expected specific error message, got %v", err)
	}
}

func TestValidateUserCredentials_MismatchedUUID(t *testing.T) {
	req := httptest.NewRequest("GET", "/test", nil)
	ctx := context.WithValue(req.Context(), "user", map[string]interface{}{
		"email":             "test@example.com",
		"uuid":              "test-uuid-123",
		"encryption_secret": "test-secret",
	})
	req = req.WithContext(ctx)

	err := ValidateUserCredentials(req, "test@example.com", "wrong-uuid")
	if err == nil {
		t.Error("Expected error for mismatched UUID")
	}
	if err.Error() != "credentials do not match authenticated user" {
		t.Errorf("Expected specific error message, got %v", err)
	}
}

func TestValidateUserCredentials_NoContext(t *testing.T) {
	req := httptest.NewRequest("GET", "/test", nil)

	err := ValidateUserCredentials(req, "test@example.com", "test-uuid-123")
	if err == nil {
		t.Error("Expected error for missing context")
	}
	if err.Error() != "user context not found" {
		t.Errorf("Expected 'user context not found', got %v", err)
	}
}

func TestValidateUserCredentials_InvalidSessionData(t *testing.T) {
	req := httptest.NewRequest("GET", "/test", nil)
	ctx := context.WithValue(req.Context(), "user", map[string]interface{}{
		"email": 12345,
		"uuid":  "test-uuid-123",
	})
	req = req.WithContext(ctx)

	err := ValidateUserCredentials(req, "test@example.com", "test-uuid-123")
	if err == nil {
		t.Error("Expected error for invalid session data")
	}
	if err.Error() != "invalid user session data" {
		t.Errorf("Expected 'invalid user session data', got %v", err)
	}
}

func TestGetSessionCredentials_ValidSession(t *testing.T) {
	req := httptest.NewRequest("GET", "/test", nil)
	ctx := context.WithValue(req.Context(), "user", map[string]interface{}{
		"email":             "test@example.com",
		"uuid":              "test-uuid-123",
		"encryption_secret": "test-secret-456",
	})
	req = req.WithContext(ctx)

	email, uuid, secret, err := GetSessionCredentials(req)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}
	if email != "test@example.com" {
		t.Errorf("Expected email test@example.com, got %s", email)
	}
	if uuid != "test-uuid-123" {
		t.Errorf("Expected uuid test-uuid-123, got %s", uuid)
	}
	if secret != "test-secret-456" {
		t.Errorf("Expected secret test-secret-456, got %s", secret)
	}
}

func TestGetSessionCredentials_NoContext(t *testing.T) {
	req := httptest.NewRequest("GET", "/test", nil)

	email, uuid, secret, err := GetSessionCredentials(req)
	if err == nil {
		t.Error("Expected error for missing context")
	}
	if err.Error() != "user context not found" {
		t.Errorf("Expected 'user context not found', got %v", err)
	}
	if email != "" || uuid != "" || secret != "" {
		t.Error("Expected empty strings for credentials")
	}
}

func TestGetSessionCredentials_IncompleteData(t *testing.T) {
	req := httptest.NewRequest("GET", "/test", nil)
	ctx := context.WithValue(req.Context(), "user", map[string]interface{}{
		"email": "test@example.com",
		"uuid":  "test-uuid-123",
	})
	req = req.WithContext(ctx)

	email, uuid, secret, err := GetSessionCredentials(req)
	if err == nil {
		t.Error("Expected error for incomplete session data")
	}
	if err.Error() != "incomplete user session data" {
		t.Errorf("Expected 'incomplete user session data', got %v", err)
	}
	if email != "" || uuid != "" || secret != "" {
		t.Error("Expected empty strings for credentials")
	}
}

func TestGetSessionCredentials_InvalidDataTypes(t *testing.T) {
	req := httptest.NewRequest("GET", "/test", nil)
	ctx := context.WithValue(req.Context(), "user", map[string]interface{}{
		"email":             12345,
		"uuid":              true,
		"encryption_secret": []string{"invalid"},
	})
	req = req.WithContext(ctx)

	email, uuid, secret, err := GetSessionCredentials(req)
	if err == nil {
		t.Error("Expected error for invalid data types")
	}
	if err.Error() != "incomplete user session data" {
		t.Errorf("Expected 'incomplete user session data', got %v", err)
	}
	if email != "" || uuid != "" || secret != "" {
		t.Error("Expected empty strings for credentials")
	}
}
