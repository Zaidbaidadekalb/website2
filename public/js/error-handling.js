export function showError(message) {
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
    }
}

export function clearError() {
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
        errorContainer.textContent = '';
        errorContainer.style.display = 'none';
    }
}

export function handleApiError(error) {
    console.error('API Error:', error);
    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        showError(`Error ${error.response.status}: ${error.response.data.message || 'An error occurred'}`);
    } else if (error.request) {
        // The request was made but no response was received
        showError('No response received from the server. Please try again later.');
    } else {
        // Something happened in setting up the request that triggered an Error
        showError('An unexpected error occurred. Please try again later.');
    }
}

export function validateInput(input, validationRules) {
    for (const rule of validationRules) {
        if (!rule.validate(input)) {
            showError(rule.message);
            return false;
        }
    }
    clearError();
    return true;
}

export const validationRules = {
    required: {
        validate: (value) => value.trim() !== '',
        message: 'This field is required.',
    },
    minLength: (length) => ({
        validate: (value) => value.length >= length,
        message: `This field must be at least ${length} characters long.`,
    }),
    maxLength: (length) => ({
        validate: (value) => value.length <= length,
        message: `This field must not exceed ${length} characters.`,
    }),
    email: {
        validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: 'Please enter a valid email address.',
    },
    numeric: {
        validate: (value) => /^\d+$/.test(value),
        message: 'This field must contain only numbers.',
    },
    // Add more validation rules as needed
};
