package models

// Request body for task related request handlers
type AddTaskRequestBody struct {
	Email            string `json:"email"`
	EncryptionSecret string `json:"encryptionSecret"`
	UUID             string `json:"UUID"`
	Description      string `json:"description"`
	Project          string `json:"project"`
	Priority         string `json:"priority"`
	DueDate          string `json:"due"`
}
type ModifyTaskRequestBody struct {
	Email            string `json:"email"`
	EncryptionSecret string `json:"encryptionSecret"`
	UUID             string `json:"UUID"`
	TaskUUID         string `json:"taskuuid"`
	Description      string `json:"description"`
	Project          string `json:"project"`
	Priority         string `json:"priority"`
	Status           string `json:"status"`
	Due              string `json:"due"`
}
type EditTaskRequestBody struct {
	Email            string `json:"email"`
	EncryptionSecret string `json:"encryptionSecret"`
	UUID             string `json:"UUID"`
	TaskUUID         string `json:"taskuuid"`
	Description      string `json:"description"`
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