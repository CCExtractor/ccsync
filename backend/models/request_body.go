package models

// Request body for task related request handlers
type AddTaskRequestBody struct {
	Email            string       `json:"email"`
	EncryptionSecret string       `json:"encryptionSecret"`
	UUID             string       `json:"UUID"`
	Description      string       `json:"description"`
	Project          string       `json:"project"`
	Priority         string       `json:"priority"`
	DueDate          *string      `json:"due"`
	Start            string       `json:"start"`
	EntryDate        string       `json:"entry"`
	WaitDate         string       `json:"wait"`
	End              string       `json:"end"`
	Recur            string       `json:"recur"`
	Tags             []string     `json:"tags"`
	Annotations      []Annotation `json:"annotations"`
	Depends          []string     `json:"depends"`
}
type ModifyTaskRequestBody struct {
	Email            string   `json:"email"`
	EncryptionSecret string   `json:"encryptionSecret"`
	UUID             string   `json:"UUID"`
	TaskUUID         string   `json:"taskuuid"`
	Description      string   `json:"description"`
	Project          string   `json:"project"`
	Priority         string   `json:"priority"`
	Status           string   `json:"status"`
	Due              string   `json:"due"`
	Tags             []string `json:"tags"`
	Depends          []string `json:"depends"`
}
type EditTaskRequestBody struct {
	Email            string       `json:"email"`
	EncryptionSecret string       `json:"encryptionSecret"`
	UUID             string       `json:"UUID"`
	TaskUUID         string       `json:"taskuuid"`
	Description      string       `json:"description"`
	Tags             []string     `json:"tags"`
	Project          string       `json:"project"`
	Start            string       `json:"start"`
	Entry            string       `json:"entry"`
	Wait             string       `json:"wait"`
	End              string       `json:"end"`
	Depends          []string     `json:"depends"`
	Due              string       `json:"due"`
	Recur            string       `json:"recur"`
	Annotations      []Annotation `json:"annotations"`
}

// EditTaskParams encapsulates all parameters needed to edit a task in Taskwarrior
// This struct is used to reduce parameter bloat and improve maintainability
type EditTaskParams struct {
	UUID             string       // User's UUID for Taskwarrior sync
	TaskUUID         string       // Task's permanent UUID (used instead of volatile taskID)
	Email            string       // User's email for temp directory naming
	EncryptionSecret string       // Encryption secret for Taskwarrior sync
	Description      string       // Task description
	Tags             []string     // Tags to add/remove (prefix with +/-)
	Project          string       // Project name
	Start            string       // Start date
	Entry            string       // Entry date
	Wait             string       // Wait date
	End              string       // End date
	Depends          []string     // Task dependencies (UUIDs)
	Due              string       // Due date
	Recur            string       // Recurrence pattern
	Annotations      []Annotation // Task annotations
}
type CompleteTaskRequestBody struct {
	Email            string `json:"email"`
	EncryptionSecret string `json:"encryptionSecret"`
	UUID             string `json:"UUID"`
	TaskUUID         string `json:"taskuuid"`
}
type DeleteTaskRequestBody struct {
	Email            string `json:"email"`
	EncryptionSecret string `json:"encryptionSecret"`
	UUID             string `json:"UUID"`
	TaskUUID         string `json:"taskuuid"`
}
type BulkCompleteTaskRequestBody struct {
	Email            string   `json:"email"`
	EncryptionSecret string   `json:"encryptionSecret"`
	UUID             string   `json:"UUID"`
	TaskUUIDs        []string `json:"taskuuids"`
}
type BulkDeleteTaskRequestBody struct {
	Email            string   `json:"email"`
	EncryptionSecret string   `json:"encryptionSecret"`
	UUID             string   `json:"UUID"`
	TaskUUIDs        []string `json:"taskuuids"`
}
