package main

import (
	"net/http"
	"os"

	"github.com/gorilla/sessions"
)

func sessionCookieOptions() *sessions.Options {
	return &sessions.Options{
		Path:     "/",
		MaxAge:   86400 * 7,                        // 7 days
		HttpOnly: true,                             // Prevent JavaScript access
		Secure:   os.Getenv("ENV") == "production", // HTTPS only in production
		SameSite: http.SameSiteLaxMode,             // CSRF protection (Lax allows OAuth redirects)
	}
}
