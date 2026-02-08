package utils

import (
	"net/http"

	"github.com/gorilla/sessions"
)

func IsSecure(r *http.Request) bool {
	if r.TLS != nil {
		return true
	}
	return r.Header.Get("X-Forwarded-Proto") == "https"
}

func SaveSessionWithSecureCookie(session *sessions.Session, r *http.Request, w http.ResponseWriter) error {
	original := session.Options.Secure
	session.Options.Secure = IsSecure(r)
	err := session.Save(r, w)
	session.Options.Secure = original
	return err
}
