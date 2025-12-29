package controllers

import (
	"errors"
	"net/http"
)

func ValidateUserCredentials(r *http.Request, requestEmail, requestUUID string) error {
	userInfo, ok := r.Context().Value("user").(map[string]interface{})
	if !ok {
		return errors.New("user context not found")
	}

	sessionEmail, emailOk := userInfo["email"].(string)
	sessionUUID, uuidOk := userInfo["uuid"].(string)

	if !emailOk || !uuidOk {
		return errors.New("invalid user session data")
	}

	if sessionEmail != requestEmail || sessionUUID != requestUUID {
		return errors.New("credentials do not match authenticated user")
	}
	return nil
}

func GetSessionCredentials(r *http.Request) (email, uuid, encryptionSecret string, err error) {
	userInfo, ok := r.Context().Value("user").(map[string]interface{})
	if !ok {
		return "", "", "", errors.New("user context not found")
	}

	email, emailOk := userInfo["email"].(string)
	uuid, uuidOk := userInfo["uuid"].(string)
	encryptionSecret, secretOk := userInfo["encryption_secret"].(string)

	if !emailOk || !uuidOk || !secretOk {
		return "", "", "", errors.New("incomplete user session data")
	}

	return email, uuid, encryptionSecret, nil
}
