package models

// Annotation represents a single annotation entry on a Taskwarrior task
type Annotation struct {
	Entry       string `json:"entry"`
	Description string `json:"description"`
}

// Task represents a Taskwarrior task
type Task struct {
	ID          int32        `json:"id"`
	Description string       `json:"description"`
	Project     string       `json:"project"`
	Tags        []string     `json:"tags"`
	Status      string       `json:"status"`
	UUID        string       `json:"uuid"`
	Urgency     float32      `json:"urgency"`
	Priority    string       `json:"priority"`
	Due         string       `json:"due"`
	Start       string       `json:"start"`
	End         string       `json:"end"`
	Entry       string       `json:"entry"`
	Wait        string       `json:"wait"`
	Modified    string       `json:"modified"`
	Depends     []string     `json:"depends"`
	RType       string       `json:"rtype"`
	Recur       string       `json:"recur"`
	Annotations []Annotation `json:"annotations"`
	IsPinned    bool         `json:"isPinned"`
}
