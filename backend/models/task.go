package models

// Task represents a Taskwarrior task
type Task struct {
	ID          int32    `json:"id"`
	Description string   `json:"description"`
	Project     string   `json:"project"`
	Tags        []string `json:"tags"`
	Status      string   `json:"status"`
	UUID        string   `json:"uuid"`
	Urgency     float32  `json:"urgency"`
	Priority    string   `json:"priority"`
	Due         string   `json:"due"`
	End         string   `json:"end"`
	Entry       string   `json:"entry"`
	Modified    string   `json:"modified"`
}