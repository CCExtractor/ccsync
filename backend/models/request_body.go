package models

// Request body for task related request handlers
type AddTaskRequestBody struct {
	Email            string   `json:"email"`
	EncryptionSecret string   `json:"encryptionSecret"`
	UUID             string   `json:"UUID"`
	Description      string   `json:"description"`
	Project          string   `json:"project"`
	Priority         string   `json:"priority"`
	DueDate          string   `json:"due"`
	Start            string   `json:"start"`
	Tags             []string `json:"tags"`
}
type ModifyTaskRequestBody struct {
	Email            string   `json:"email"`
	EncryptionSecret string   `json:"encryptionSecret"`
	UUID             string   `json:"UUID"`
	TaskID           string   `json:"taskid"`
	Description      string   `json:"description"`
	Project          string   `json:"project"`
	Priority         string   `json:"priority"`
	Status           string   `json:"status"`
	Due              string   `json:"due"`
	Tags             []string `json:"tags"`
}
type EditTaskRequestBody struct {
	Email            string   `json:"email"`
	EncryptionSecret string   `json:"encryptionSecret"`
	UUID             string   `json:"UUID"`
	TaskID           string   `json:"taskid"`
	Description      string   `json:"description"`
	Tags             []string `json:"tags"`
	Project          string   `json:"project"`
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
