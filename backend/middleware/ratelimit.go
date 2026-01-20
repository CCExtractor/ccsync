package middleware

import (
	"fmt"
	"net"
	"net/http"
	"os"
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

// isTrustedProxy checks if the request is from a trusted proxy.
// In production, we trust localhost connections (nginx running on same server).
// The TRUSTED_PROXIES env var can specify additional trusted proxy IPs (comma-separated).
func isTrustedProxy(remoteAddr string) bool {
	// Extract IP from remoteAddr (format: "ip:port" or just "ip")
	host, _, err := net.SplitHostPort(remoteAddr)
	if err != nil {
		host = remoteAddr
	}

	// Parse the IP
	ip := net.ParseIP(host)
	if ip == nil {
		return false
	}

	// In production, trust loopback (nginx on same server)
	if ip.IsLoopback() {
		return true
	}

	// Check against TRUSTED_PROXIES env var
	trustedProxies := os.Getenv("TRUSTED_PROXIES")
	if trustedProxies != "" {
		for _, trusted := range strings.Split(trustedProxies, ",") {
			trusted = strings.TrimSpace(trusted)
			// Support CIDR notation
			if strings.Contains(trusted, "/") {
				_, network, err := net.ParseCIDR(trusted)
				if err == nil && network.Contains(ip) {
					return true
				}
			} else {
				trustedIP := net.ParseIP(trusted)
				if trustedIP != nil && trustedIP.Equal(ip) {
					return true
				}
			}
		}
	}

	// In Docker environments, common bridge networks
	// 172.17.0.0/16 is the default Docker bridge network
	// 10.0.0.0/8 is commonly used for internal networks
	if os.Getenv("ENV") == "production" {
		// Trust Docker internal networks in production
		dockerBridge := &net.IPNet{
			IP:   net.ParseIP("172.16.0.0"),
			Mask: net.CIDRMask(12, 32),
		}
		if dockerBridge.Contains(ip) {
			return true
		}
	}

	return false
}

func getRealIP(r *http.Request) string {
	// Only trust proxy headers if request is from a trusted proxy
	if isTrustedProxy(r.RemoteAddr) {
		// X-Real-IP is set by nginx
		if ip := r.Header.Get("X-Real-IP"); ip != "" {
			return ip
		}

		// X-Forwarded-For contains a list of IPs, take the first (original client)
		if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
			ips := strings.Split(xff, ",")
			if len(ips) > 0 {
				return strings.TrimSpace(ips[0])
			}
		}
	}

	// For direct connections or untrusted proxies, use RemoteAddr
	ip, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		// RemoteAddr might not have a port
		return r.RemoteAddr
	}

	return ip
}
