package utils

import (
	"crypto/tls"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gorilla/sessions"
	"github.com/stretchr/testify/assert"
)

func Test_IsSecure(t *testing.T) {
	tests := []struct {
		name       string
		setupReq   func(r *http.Request)
		wantSecure bool
	}{
		{
			name:       "plain HTTP — no TLS, no header",
			setupReq:   func(r *http.Request) {},
			wantSecure: false,
		},
		{
			name:       "TLS connection",
			setupReq:   func(r *http.Request) { r.TLS = &tls.ConnectionState{} },
			wantSecure: true,
		},
		{
			name:       "X-Forwarded-Proto: https",
			setupReq:   func(r *http.Request) { r.Header.Set("X-Forwarded-Proto", "https") },
			wantSecure: true,
		},
		{
			name:       "X-Forwarded-Proto: http",
			setupReq:   func(r *http.Request) { r.Header.Set("X-Forwarded-Proto", "http") },
			wantSecure: false,
		},
		{
			name: "TLS takes precedence over contradictory header",
			setupReq: func(r *http.Request) {
				r.TLS = &tls.ConnectionState{}
				r.Header.Set("X-Forwarded-Proto", "http")
			},
			wantSecure: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r := httptest.NewRequest(http.MethodGet, "/", nil)
			tt.setupReq(r)
			assert.Equal(t, tt.wantSecure, IsSecure(r))
		})
	}
}

func newTestStore() *sessions.CookieStore {
	return sessions.NewCookieStore([]byte("test-secret-key"))
}

func Test_SaveSessionWithSecureCookie_SecureCookieOnHTTPS(t *testing.T) {
	store := newTestStore()
	r := httptest.NewRequest(http.MethodGet, "/", nil)
	r.Header.Set("X-Forwarded-Proto", "https")
	w := httptest.NewRecorder()

	session, _ := store.Get(r, "session-name")
	assert.NoError(t, SaveSessionWithSecureCookie(session, r, w))
	assert.Contains(t, w.Header().Get("Set-Cookie"), "Secure")
}

func Test_SaveSessionWithSecureCookie_NoSecureCookieOnHTTP(t *testing.T) {
	store := newTestStore()
	r := httptest.NewRequest(http.MethodGet, "/", nil)
	w := httptest.NewRecorder()

	session, _ := store.Get(r, "session-name")
	assert.NoError(t, SaveSessionWithSecureCookie(session, r, w))
	assert.NotContains(t, w.Header().Get("Set-Cookie"), "Secure")
}

func Test_SaveSessionWithSecureCookie_RestoresOriginalSecureFlag(t *testing.T) {
	tests := []struct {
		name           string
		originalSecure bool
		proto          string
	}{
		{"original false, HTTPS request — restored to false", false, "https"},
		{"original true, HTTP request — restored to true", true, ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			store := newTestStore()
			r := httptest.NewRequest(http.MethodGet, "/", nil)
			if tt.proto != "" {
				r.Header.Set("X-Forwarded-Proto", tt.proto)
			}
			w := httptest.NewRecorder()

			session, _ := store.Get(r, "session-name")
			session.Options.Secure = tt.originalSecure

			_ = SaveSessionWithSecureCookie(session, r, w)

			assert.Equal(t, tt.originalSecure, session.Options.Secure)
		})
	}
}
