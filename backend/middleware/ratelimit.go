package middleware

import (
	"net/http"
	"strings"
	"sync"
	"time"
)

type RateLimiter struct {
	sync.RWMutex
	requests     map[string][]time.Time
	windowSize   time.Duration
	maxRequests  int
}

func NewRateLimiter(windowSize time.Duration, maxRequests int) *RateLimiter {
	limiter := &RateLimiter{
		requests:    make(map[string][]time.Time),
		windowSize:  windowSize,
		maxRequests: maxRequests,
	}
	
	go func() {
		for {
			time.Sleep(windowSize)
			limiter.cleanup()
		}
	}()
	
	return limiter
}

func (rl *RateLimiter) cleanup() {
	rl.Lock()
	defer rl.Unlock()
	
	now := time.Now()
	for ip, times := range rl.requests {
		var valid []time.Time
		for _, t := range times {
			if now.Sub(t) <= rl.windowSize {
				valid = append(valid, t)
			}
		}
		if len(valid) > 0 {
			rl.requests[ip] = valid
		} else {
			delete(rl.requests, ip)
		}
	}
}

func (rl *RateLimiter) IsAllowed(ip string) bool {
	rl.Lock()
	defer rl.Unlock()
	
	now := time.Now()
	times := rl.requests[ip]
	
	var valid []time.Time
	for _, t := range times {
		if now.Sub(t) <= rl.windowSize {
			valid = append(valid, t)
		}
	}
	
	if len(valid) >= rl.maxRequests {
		rl.requests[ip] = valid
		return false
	}
	
	valid = append(valid, now)
	rl.requests[ip] = valid
	return true
}

func RateLimitMiddleware(next http.Handler, windowSize time.Duration, maxRequests int) http.Handler {
	limiter := NewRateLimiter(windowSize, maxRequests)
	
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := r.Header.Get("X-Forwarded-For")
		if ip == "" {
			ip = r.RemoteAddr
		}
		if idx := strings.Index(ip, ":"); idx != -1 {
			ip = ip[:idx]
		}
		
		if !limiter.IsAllowed(ip) {
			w.Header().Set("Retry-After", windowSize.String())
			http.Error(w, "Rate limit exceeded. Please try again later.", http.StatusTooManyRequests)
			return
		}
		
		next.ServeHTTP(w, r)
	})
}
