package middleware

import (
	"context"
	"net/http"

	"github.com/gorilla/sessions"
)

func RequireAuth(sessionStore *sessions.CookieStore) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			session, _ := sessionStore.Get(r, "session-name")
			userInfo, ok := session.Values["user"].(map[string]interface{})
			if !ok || userInfo == nil {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}
			ctx := context.WithValue(r.Context(), "user", userInfo)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func GetUserFromContext(r *http.Request) (map[string]interface{}, bool) {
	userInfo, ok := r.Context().Value("user").(map[string]interface{})
	return userInfo, ok
}
