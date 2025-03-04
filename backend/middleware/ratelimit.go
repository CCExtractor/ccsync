package middleware

import (
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"
)

type RateLimiter struct {
	sync.RWMutex
	requests    map[string]*FixedWindow
	windowSize  time.Duration
	maxRequests int
	cleanupTick time.Duration
}

type FixedWindow struct {
	count       int
	windowStart time.Time
}

func NewRateLimiter(windowSize time.Duration, maxRequests int) *RateLimiter {
	limiter := &RateLimiter{
		requests:    make(map[string]*FixedWindow),
		windowSize:  windowSize,
		maxRequests: maxRequests,
		cleanupTick: time.Minute,
	}

	go limiter.startCleanup()
	return limiter
}

func (rl *RateLimiter) startCleanup() {
	ticker := time.NewTicker(rl.cleanupTick)
	defer ticker.Stop()

	for range ticker.C {
		rl.cleanup()
	}
}

func (rl *RateLimiter) cleanup() {
	rl.Lock()
	defer rl.Unlock()

	now := time.Now()
	for ip, window := range rl.requests {
		if now.Sub(window.windowStart) > rl.windowSize*2 {
			delete(rl.requests, ip)
		}
	}
}

func (rl *RateLimiter) IsAllowed(ip string) (bool, time.Time) {
	rl.Lock()
	defer rl.Unlock()

	now := time.Now()
	window, exists := rl.requests[ip]

	if !exists {
		rl.requests[ip] = &FixedWindow{
			count:       1,
			windowStart: now,
		}
		return true, now.Add(rl.windowSize)
	}

	windowEnd := window.windowStart.Add(rl.windowSize)
	if now.After(windowEnd) {
		window.count = 1
		window.windowStart = now
		return true, now.Add(rl.windowSize)
	}

	if window.count < rl.maxRequests {
		window.count++
		return true, windowEnd
	}

	return false, windowEnd
}

func RateLimitMiddleware(limiter *RateLimiter) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := getRealIP(r)

			allowed, resetTime := limiter.IsAllowed(ip)
			if !allowed {
				w.Header().Set("X-RateLimit-Limit", fmt.Sprintf("%d", limiter.maxRequests))
				w.Header().Set("X-RateLimit-Reset", resetTime.Format(time.RFC1123))
				w.Header().Set("Retry-After", fmt.Sprintf("%.0f", time.Until(resetTime).Seconds()))
				http.Error(w, "Rate limit exceeded. Please try again later.", http.StatusTooManyRequests)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func getRealIP(r *http.Request) string {
	ip := r.Header.Get("X-Real-IP")
	if ip != "" {
		return ip
	}

	ip = r.Header.Get("X-Forwarded-For")
	if ip != "" {
		ips := strings.Split(ip, ",")
		if len(ips) > 0 {
			return strings.TrimSpace(ips[0])
		}
	}

	ip = r.RemoteAddr
	if idx := strings.Index(ip, ":"); idx != -1 {
		ip = ip[:idx]
	}

	return ip
}
