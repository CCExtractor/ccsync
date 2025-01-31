package middleware

import (
	"testing"
	"time"
	"fmt"
)

func TestRateLimiter_MultipleEndpoints(t *testing.T) {
    limiter := NewRateLimiter(30*time.Second, 50)
    ip := "192.XXX.1.1"

    allowedCount := 0
    for i := 0; i < 60; i++ {
        if limiter.IsAllowed(ip) {
            allowedCount++
        }
    }

    if allowedCount != 50 {
        t.Errorf("Expected 50 allowed requests, got %d", allowedCount)
    }
}

func TestRateLimiter_DifferentIPs(t *testing.T) {
	limiter := NewRateLimiter(30*time.Second, 50)
	
	for i := 0; i < 100; i++ {
		ip := fmt.Sprintf("192.168.1.%d", i)
		if !limiter.IsAllowed(ip) {
			t.Errorf("Should allow requests from different IPs")
		}
	}
}