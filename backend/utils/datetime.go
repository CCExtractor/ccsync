package utils

import (
	"fmt"
	"time"
)

func ConvertISOToTaskwarriorFormat(isoDatetime string) (string, error) {
	if isoDatetime == "" {
		return "", nil
	}

	// Try parsing the specific ISO formats we actually receive from frontend
	formats := []string{
		"2006-01-02T15:04:05.000Z", // "2025-12-27T14:30:00.000Z" (frontend datetime with milliseconds)
		"2006-01-02T15:04:05Z",     // "2025-12-27T14:30:00Z" (datetime without milliseconds)
		"2006-01-02",               // "2025-12-27" (date only)
	}

	var parsedTime time.Time
	var err error
	var isDateOnly bool

	for i, format := range formats {
		parsedTime, err = time.Parse(format, isoDatetime)
		if err == nil {
			// Check if it's date-only format (last format in array)
			isDateOnly = (i == 2) // "2006-01-02" format
			break
		}
	}

	if err != nil {
		return "", fmt.Errorf("unable to parse datetime '%s': %v", isoDatetime, err)
	}

	if isDateOnly {
		return parsedTime.Format("2006-01-02"), nil
	} else {
		return parsedTime.Format("2006-01-02T15:04:05"), nil
	}
}
func ConvertOptionalISOToTaskwarriorFormat(isoDatetime *string) (string, error) {
	if isoDatetime == nil || *isoDatetime == "" {
		return "", nil
	}
	return ConvertISOToTaskwarriorFormat(*isoDatetime)
}
