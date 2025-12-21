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
  },
  'EMAIL_NOT_CONFIRMED': {
    title: 'Email not confirmed',
    message: 'Please check your inbox and confirm your email address.',
    suggestion: 'Look for an email from us and click the confirmation link.'
  },
  'INVALID_CREDENTIALS': {
    title: 'Invalid login',
    message: 'The email or password you entered is incorrect.',
    suggestion: 'Check your spelling and try again, or reset your password.'
  },
  'EMAIL_ALREADY_EXISTS': {
    title: 'Email already registered',
    message: 'An account with this email already exists.',
    suggestion: 'Try signing in instead, or use a different email address.'
  },
  'WEAK_PASSWORD': {
    title: 'Password too weak',
    message: 'Your password must be at least 6 characters long.',
    suggestion: 'Use a mix of letters, numbers, and symbols for better security.'
  },
  'INVALID_EMAIL': {
    title: 'Invalid email',
    message: 'Please enter a valid email address.',
    suggestion: 'Make sure the email format is correct (e.g., name@example.com).'
  },
  'TASK_NOT_FOUND': {
    title: 'Task not found',
    message: 'This task no longer exists or has been deleted.',
    suggestion: 'Go back to the tasks list and select another task.'
  },
  'SPACE_NOT_FOUND': {
    title: 'Space not found',
    message: 'The invite code is invalid or the space no longer exists.',
    suggestion: 'Double-check the code with your flatmates and try again.'
  },
  'ALREADY_MEMBER': {
    title: 'Already a member',
    message: 'You\'re already a member of this space!',
    suggestion: 'Select this space from your spaces list to start using it.'
  }
};

export function getErrorMessage(code: string): {
  title: string;
  message: string;
  suggestion?: string;
} {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES['UNKNOWN_ERROR'];
}

// Helper to extract error code from Supabase error
export function parseSupabaseError(error: { message?: string; code?: string }): string {
  const message = error.message?.toLowerCase() || '';
  
  if (message.includes('email not confirmed')) return 'EMAIL_NOT_CONFIRMED';
  if (message.includes('invalid login') || message.includes('invalid credentials')) return 'INVALID_CREDENTIALS';
  if (message.includes('already registered') || message.includes('already exists')) return 'EMAIL_ALREADY_EXISTS';
  if (message.includes('password') && message.includes('short')) return 'WEAK_PASSWORD';
  if (message.includes('invalid email')) return 'INVALID_EMAIL';
  if (message.includes('not found')) return 'TASK_NOT_FOUND';
  if (message.includes('permission')) return 'PERMISSION_DENIED';
  if (message.includes('network') || message.includes('fetch')) return 'NETWORK_ERROR';
  
  return 'UNKNOWN_ERROR';
}
