package main

import (
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestSessionCookieOptions_Production(t *testing.T) {
	t.Setenv("ENV", "production")

	opts := sessionCookieOptions()

	assert.Equal(t, "/", opts.Path)
	assert.Equal(t, 86400*7, opts.MaxAge)
	assert.True(t, opts.HttpOnly)
	assert.True(t, opts.Secure)
	assert.Equal(t, http.SameSiteLaxMode, opts.SameSite)
}

func TestSessionCookieOptions_NonProduction(t *testing.T) {
	t.Setenv("ENV", "development")

	opts := sessionCookieOptions()

	assert.Equal(t, 86400*7, opts.MaxAge)
	assert.True(t, opts.HttpOnly)
	assert.False(t, opts.Secure)
}

func TestSessionCookieOptions_UnsetENV(t *testing.T) {
	t.Setenv("ENV", "")

	opts := sessionCookieOptions()

	assert.Equal(t, 86400*7, opts.MaxAge)
	assert.False(t, opts.Secure)
}
