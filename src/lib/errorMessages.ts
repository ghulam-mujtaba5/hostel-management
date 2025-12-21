export const ERROR_MESSAGES: Record<string, {
  title: string;
  message: string;
  suggestion?: string;
}> = {
  'UPLOAD_TOO_LARGE': {
    title: 'Photo too large',
    message: 'Your photo is larger than 5MB.',
    suggestion: 'Try compressing the image or selecting a smaller file.'
  },
  'UPLOAD_INVALID_TYPE': {
    title: 'Invalid file type',
    message: 'Only JPG, PNG, and WebP formats are supported.',
    suggestion: 'Convert your image and try again.'
  },
  'NETWORK_ERROR': {
    title: 'Connection failed',
    message: 'Check your internet connection and try again.',
    suggestion: 'Make sure you\'re connected to WiFi or have mobile data enabled.'
  },
  'PERMISSION_DENIED': {
    title: 'Permission denied',
    message: 'You don\'t have permission to perform this action.',
    suggestion: 'Only space members can manage tasks. Join the space first.'
  },
  'TASK_ALREADY_TAKEN': {
    title: 'Task already taken',
    message: 'Someone else just took this task!',
    suggestion: 'Choose another task from the available list.'
  },
  'SPACE_FULL': {
    title: 'Space is full',
    message: 'This space has reached its member limit.',
    suggestion: 'Contact the space admin to request access.'
  },
  'VALIDATION_ERROR': {
    title: 'Please check your input',
    message: 'Some fields are invalid or missing.',
    suggestion: 'Review the form and make sure all required fields are filled.'
  },
  'UNKNOWN_ERROR': {
    title: 'Something went wrong',
    message: 'An unexpected error occurred.',
    suggestion: 'Please try again or contact support if the problem persists.'
  }
};

export function getErrorMessage(code: string): {
  title: string;
  message: string;
  suggestion?: string;
} {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES['UNKNOWN_ERROR'];
}
