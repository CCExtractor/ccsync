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
	End              string       `json:"end"`
	Tags             []string     `json:"tags"`
	Annotations      []Annotation `json:"annotations"`
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
	Start            string   `json:"start"`
	Entry            string   `json:"entry"`
	Wait             string   `json:"wait"`
	End              string   `json:"end"`
	Depends          []string `json:"depends"`
	Due              string   `json:"due"`
	Recur            string   `json:"recur"`
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
