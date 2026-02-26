export function isValidInput(value) {
    return value.trim().length > 0;
}

export function showError(errorElement, message) {
    if (errorElement) errorElement.textContent = message;
}

export function clearError(errorElement) {
    if (errorElement) errorElement.textContent = "";
}