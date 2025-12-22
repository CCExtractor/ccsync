package controllers

import (
	"fmt"
	"time"
)

var dateLayouts = []string{
	time.RFC3339,
	"2006-01-02T15:04:05.000Z",
	"2006-01-02T15:04:05",
	"2006-01-02",
}

// validateStartEnd returns an error if both start and end are provided and end is before start.
func validateStartEnd(start, end string) error {
	if start == "" || end == "" {
		return nil
	}

	var sTime, eTime time.Time
	var err error

	// try multiple layouts for parsing
	for _, l := range dateLayouts {
		if sTime.IsZero() {
			sTime, err = time.Parse(l, start)
			if err == nil {
				break
			}
		}
	}
	if sTime.IsZero() {
		// as a last resort try Date constructor via RFC3339 parsing of date-only
		if t, err2 := time.Parse("2006-01-02", start); err2 == nil {
			sTime = t
		}
	}

	for _, l := range dateLayouts {
		if eTime.IsZero() {
			eTime, err = time.Parse(l, end)
			if err == nil {
				break
			}
		}
	}
	if eTime.IsZero() {
		if t, err2 := time.Parse("2006-01-02", end); err2 == nil {
			eTime = t
		}
	}

	// If either failed to parse, skip strict validation
	if sTime.IsZero() || eTime.IsZero() {
		return nil
	}

	if eTime.Before(sTime) {
		return fmt.Errorf("end must be greater than or equal to start")
	}
	return nil
}
