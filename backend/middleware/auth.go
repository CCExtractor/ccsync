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

// AuthMiddleware validates that the user is authenticated and injects session
// credentials into the request body. This ensures:
// 1. Only authenticated users can access protected endpoints
// 2. Users cannot manipulate credentials to access other users' data
// 3. Frontend doesn't need to store/send sensitive encryption secrets
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

			// Inject session credentials into headers for GET requests
			r.Header.Set("X-User-Email", sessionEmail)
			r.Header.Set("X-User-UUID", sessionUUID)
			r.Header.Set("X-Encryption-Secret", sessionSecret)

			// For POST requests with JSON body, inject session credentials
			if r.Method == http.MethodPost && r.Body != nil {
				// Read the body
				bodyBytes, err := io.ReadAll(r.Body)
				if err != nil {
					http.Error(w, "Failed to read request body", http.StatusBadRequest)
					return
				}

				// Parse the body as a generic map
				var bodyMap map[string]interface{}
				if err := json.Unmarshal(bodyBytes, &bodyMap); err == nil {
					// Inject/overwrite credentials from session
					// This ensures users can't manipulate credentials to access other users' data
					bodyMap["email"] = sessionEmail
					bodyMap["UUID"] = sessionUUID
					bodyMap["encryptionSecret"] = sessionSecret

					// Re-encode the modified body
					modifiedBody, err := json.Marshal(bodyMap)
					if err != nil {
						http.Error(w, "Failed to process request body", http.StatusInternalServerError)
						return
					}
					r.Body = io.NopCloser(bytes.NewBuffer(modifiedBody))
					r.ContentLength = int64(len(modifiedBody))
				} else {
					// If we can't parse the body, restore original and let handler deal with it
					r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))
				}
			}

			next.ServeHTTP(w, r)
		})
	}
}
