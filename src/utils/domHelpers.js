export function isValidInput(value) {
    return value.trim().length > 0;
}

export function showError(errorElement, message) {
    errorElement.textContent = message;
}

export function clearError(errorElement) {
    errorElement.textContent = "";
}