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
	requests     map[string]*TokenBucket
	windowSize   time.Duration
	maxRequests  int
	cleanupTick  time.Duration
}

type TokenBucket struct {
	tokens    float64
	lastTime  time.Time
	capacity  float64
	rate      float64
}

func NewRateLimiter(windowSize time.Duration, maxRequests int) *RateLimiter {
	limiter := &RateLimiter{
		requests:    make(map[string]*TokenBucket),
		windowSize:  windowSize,
		maxRequests: maxRequests,
		cleanupTick: time.Minute,
	}
	
	go func() {
		ticker := time.NewTicker(limiter.cleanupTick)
		for range ticker.C {
			limiter.cleanup()
		}
	}()
	
	return limiter
}

func (rl *RateLimiter) cleanup() {
	rl.Lock()
	defer rl.Unlock()
	
	now := time.Now()
	for ip, bucket := range rl.requests {
		if now.Sub(bucket.lastTime) > rl.windowSize*2 {
			delete(rl.requests, ip)
		}
	}
}

func (rl *RateLimiter) IsAllowed(ip string) bool {
	rl.Lock()
	defer rl.Unlock()

	now := time.Now()
	bucket, exists := rl.requests[ip]

	if !exists {
		bucket = &TokenBucket{
			tokens:    float64(rl.maxRequests - 1), // Start with max-1 to account for first request
			lastTime:  now,
			capacity:  float64(rl.maxRequests),
			rate:      float64(rl.maxRequests) / rl.windowSize.Seconds(),
		}
		rl.requests[ip] = bucket
		return true
	}

	elapsed := now.Sub(bucket.lastTime).Seconds()
	bucket.tokens += elapsed * bucket.rate

	if bucket.tokens > bucket.capacity {
		bucket.tokens = bucket.capacity
	}

	bucket.lastTime = now

	if bucket.tokens >= 1 {
		bucket.tokens--
		return true
	}

	return false
}

func RateLimitMiddleware(next http.Handler, windowSize time.Duration, maxRequests int) http.Handler {
	limiter := NewRateLimiter(windowSize, maxRequests)
	
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := getRealIP(r)
		
		if !limiter.IsAllowed(ip) {
			w.Header().Set("X-RateLimit-Limit", fmt.Sprintf("%d", maxRequests))
			w.Header().Set("X-RateLimit-Reset", time.Now().Add(windowSize).Format(time.RFC1123))
			w.Header().Set("Retry-After", windowSize.String())
			http.Error(w, "Rate limit exceeded. Please try again later.", http.StatusTooManyRequests)
			return
		}
		
		next.ServeHTTP(w, r)
	})
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