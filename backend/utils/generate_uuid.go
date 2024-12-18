package utils

import "github.com/google/uuid"

// logic to generate client ID for tw config
func GenerateUUID(email, id string) string {
	namespace := uuid.NewMD5(uuid.NameSpaceOID, []byte(email+id))
	return namespace.String()
}
