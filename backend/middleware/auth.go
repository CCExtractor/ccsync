package middleware

import (
	"bytes"
	"ccsync_backend/utils"
	"encoding/json"
	"io"
	"net/http"

	"github.com/gorilla/sessions"
)

// credentialsPayload represents the common credential fields in request bodies
type credentialsPayload struct {
	Email            string `json:"email"`
	EncryptionSecret string `json:"encryptionSecret"`
	UUID             string `json:"UUID"`
}

// AuthMiddleware validates that the user is authenticated and that request body
// credentials match the session credentials to prevent unauthorized access.
func AuthMiddleware(store *sessions.CookieStore) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Get session
			session, err := store.Get(r, "session-name")
			if err != nil {
				utils.Logger.Warnf("Auth middleware: failed to get session: %v", err)
				http.Error(w, "Authentication required", http.StatusUnauthorized)
				return
			}

			// Check if user is authenticated
			userInfo, ok := session.Values["user"].(map[string]interface{})
			if !ok || userInfo == nil {
				http.Error(w, "Authentication required", http.StatusUnauthorized)
				return
			}

			// Extract session credentials
			sessionEmail, _ := userInfo["email"].(string)
			sessionUUID, _ := userInfo["uuid"].(string)
			sessionSecret, _ := userInfo["encryption_secret"].(string)

			if sessionEmail == "" || sessionUUID == "" || sessionSecret == "" {
				utils.Logger.Warnf("Auth middleware: incomplete session credentials")
				http.Error(w, "Authentication required", http.StatusUnauthorized)
				return
			}

			// For POST requests with JSON body, validate credentials match session
			if r.Method == http.MethodPost && r.Body != nil {
				// Read the body
				bodyBytes, err := io.ReadAll(r.Body)
				if err != nil {
					http.Error(w, "Failed to read request body", http.StatusBadRequest)
					return
				}
				// Restore the body for the next handler
				r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

				// Parse credentials from body
				var creds credentialsPayload
				if err := json.Unmarshal(bodyBytes, &creds); err == nil {
					// If credentials are provided in the body, validate they match session
					if creds.Email != "" || creds.UUID != "" || creds.EncryptionSecret != "" {
						if creds.Email != sessionEmail {
							utils.Logger.Warnf("Auth middleware: email mismatch - session=%s, request=%s", sessionEmail, creds.Email)
							http.Error(w, "Credential mismatch: email does not match session", http.StatusForbidden)
							return
						}
						if creds.UUID != sessionUUID {
							utils.Logger.Warnf("Auth middleware: UUID mismatch - session=%s, request=%s", sessionUUID, creds.UUID)
							http.Error(w, "Credential mismatch: UUID does not match session", http.StatusForbidden)
							return
						}
						if creds.EncryptionSecret != sessionSecret {
							utils.Logger.Warnf("Auth middleware: encryption secret mismatch for user %s", sessionEmail)
							http.Error(w, "Credential mismatch: encryption secret does not match session", http.StatusForbidden)
							return
						}
					}
				}
			}

			next.ServeHTTP(w, r)
		})
	}
}
