package controllers

import (
	"strings"
	"testing"
)

func TestValidateStartEnd_Table(t *testing.T) {
	tests := []struct {
		name    string
		start   string
		end     string
		wantErr bool
	}{
		{name: "equal date-only", start: "2025-01-01", end: "2025-01-01", wantErr: false},
		{name: "end after start date-only", start: "2025-01-01", end: "2025-01-02", wantErr: false},
		{name: "end before start date-only", start: "2025-01-02", end: "2025-01-01", wantErr: true},
		{name: "RFC3339 times valid", start: "2025-01-01T10:00:00Z", end: "2025-01-01T12:00:00Z", wantErr: false},
		{name: "RFC3339 times invalid (end before)", start: "2025-01-01T12:00:00Z", end: "2025-01-01T10:00:00Z", wantErr: true},
		{name: "millisecond layout valid", start: "2025-01-01T08:00:00.000Z", end: "2025-01-01T09:00:00.000Z", wantErr: false},
		{name: "unparsable inputs skip validation", start: "not-a-date", end: "also-not", wantErr: false},
		{name: "start unparsable end parseable skip", start: "bad", end: "2025-01-02", wantErr: false},
		{name: "end unparsable start parseable skip", start: "2025-01-02", end: "bad", wantErr: false},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			err := validateStartEnd(tc.start, tc.end)
			if tc.wantErr {
				if err == nil {
					t.Fatalf("expected error but got nil for start=%q end=%q", tc.start, tc.end)
				}
				if !strings.Contains(err.Error(), "end must") {
					t.Fatalf("unexpected error message: %v", err)
				}
			} else {
				if err != nil {
					t.Fatalf("expected no error but got: %v for start=%q end=%q", err, tc.start, tc.end)
				}
			}
		})
	}
}
