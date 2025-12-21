/**
 * Google OAuth Configuration for HostelMate App
 * MCP Cloud Console Settings Integration
 */

// ====================
// 1. GOOGLE CLOUD CONSOLE SETUP
// ====================

export const googleCloudConsoleConfig = {
  projectName: "HostelMate-OAuth-Setup",
  apis: {
    required: [
      {
        name: "Google+ API",
        id: "plus.googleapis.com",
        status: "ENABLE",
        description: "Required for OAuth authentication"
      },
      {
        name: "Google Sign-In",
        id: "oauth2.googleapis.com",
        status: "ENABLE",
        description: "OAuth 2.0 authentication service"
      },
      {
        name: "Identity Toolkit API",
        id: "identitytoolkit.googleapis.com",
        status: "ENABLE",
        description: "Additional identity services"
      }
    ]
  },

  // OAuth 2.0 Credentials Configuration
  oauth2Credentials: {
    applicationType: "Web application",
    authorizedJavaScriptOrigins: [
      "https://uyertzuadcneniblfzcs.supabase.co",
      "https://hostel-management-topaz-ten.vercel.app",
      "http://localhost:3000",
      "http://127.0.0.1:3000"
    ],
    authorizedRedirectURIs: [
      "https://uyertzuadcneniblfzcs.supabase.co/auth/v1/callback",
      "https://hostel-management-topaz-ten.vercel.app/auth/callback",
      "http://localhost:3000/auth/callback",
      "http://127.0.0.1:3000/auth/callback"
    ]
  },

  // Scopes required for the app
  requiredScopes: [
    "openid",
    "email",
    "profile"
  ],

  // Step-by-step setup guide
  setupSteps: [
    {
      step: 1,
      title: "Create Google Cloud Project",
      url: "https://console.cloud.google.com/projectcreate",
      instructions: [
        "Click 'Create Project'",
        "Enter project name: 'HostelMate-OAuth'",
        "Click 'Create'",
        "Wait for project to be created"
      ]
    },
    {
      step: 2,
      title: "Enable Required APIs",
      url: "https://console.cloud.google.com/apis/library",
      instructions: [
        "Search for 'Google+ API'",
        "Click 'Enable'",
        "Search for 'Google Sign-In'",
        "Click 'Enable'",
        "Return to APIs & Services dashboard"
      ]
    },
    {
      step: 3,
      title: "Create OAuth 2.0 Credentials",
      url: "https://console.cloud.google.com/apis/credentials",
      instructions: [
        "Click 'Create Credentials' button",
        "Select 'OAuth 2.0 Client IDs'",
        "Choose 'Web application'",
        "Add authorized JavaScript origins",
        "Add authorized redirect URIs (see config above)",
        "Click 'Create'",
        "Download JSON file and save securely"
      ]
    },
    {
      step: 4,
      title: "Configure in Supabase",
      url: "https://supabase.com/dashboard/project/uyertzuadcneniblfzcs/auth/providers",
      instructions: [
        "Go to Authentication > Providers",
        "Find 'Google' provider",
        "Click 'Enable'",
        "Paste Client ID from Google Cloud",
        "Paste Client Secret from Google Cloud",
        "Click 'Save'",
        "Wait for confirmation"
      ]
    },
    {
      step: 5,
      title: "Test Google OAuth",
      url: "https://hostel-management-topaz-ten.vercel.app/login",
      instructions: [
        "Navigate to app login page",
        "Look for 'Sign in with Google' button",
        "Click it",
        "Complete Google login flow",
        "Verify redirect back to app"
      ]
    }
  ]
};

// ====================
// 2. SUPABASE AUTHENTICATION CONFIGURATION
// ====================

export const supabaseAuthConfig = {
  project: {
    ref: "uyertzuadcneniblfzcs",
    url: "https://uyertzuadcneniblfzcs.supabase.co",
    region: "South Asia (Mumbai)"
  },

  providers: {
    email: {
      enabled: true,
      autoConfirm: false,
      doubleConfirmChanges: true,
      maxFrequencyLimit: "100/hour",
      inboundEmailRateLimit: "100/hour"
    },

    google: {
      enabled: false, // Set to true after configuration
      clientId: "{{ GOOGLE_CLIENT_ID }}",
      clientSecret: "{{ GOOGLE_CLIENT_SECRET }}",
      redirectUri: "https://uyertzuadcneniblfzcs.supabase.co/auth/v1/callback",
      scopes: ["openid", "email", "profile"],
      mappings: {
        email: "email",
        username: "given_name",
        fullName: "name",
        avatarUrl: "picture"
      }
    },

    phone: {
      enabled: false,
      provider: "twilio"
    }
  },

  jwt: {
    expiry: 3600,
    refreshTokenExpiry: 604800,
    algorithm: "HS256"
  },

  security: {
    passwordMinLength: 6,
    passwordRequired: true,
    emailConfirmationRequired: false,
    phoneConfirmationRequired: false,
    enableMultiFactorAuth: false
  },

  sessions: {
    duration: 3600,
    refreshDuration: 604800,
    maxConcurrent: 10
  }
};

// ====================
// 3. ENVIRONMENT VARIABLES
// ====================

export const environmentVariables = {
  development: {
    NEXT_PUBLIC_SUPABASE_URL: "https://uyertzuadcneniblfzcs.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "{{ YOUR_ANON_KEY }}",
    SUPABASE_SERVICE_ROLE_KEY: "{{ YOUR_SERVICE_ROLE_KEY }}",
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: "{{ YOUR_GOOGLE_CLIENT_ID }}",
    ADMIN_PORTAL_PASSWORD: "123456789"
  },

  production: {
    NEXT_PUBLIC_SUPABASE_URL: "https://uyertzuadcneniblfzcs.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "{{ YOUR_ANON_KEY }}",
    SUPABASE_SERVICE_ROLE_KEY: "{{ YOUR_SERVICE_ROLE_KEY }}",
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: "{{ YOUR_GOOGLE_CLIENT_ID }}",
    ADMIN_PORTAL_PASSWORD: "{{ SECURE_ADMIN_PASSWORD }}"
  }
};

// ====================
// 4. GOOGLE OAUTH FLOW
// ====================

export const googleOAuthFlow = {
  signUpFlow: [
    {
      step: 1,
      action: "User clicks 'Sign in with Google'",
      endpoint: "/api/auth/google"
    },
    {
      step: 2,
      action: "Redirect to Google consent screen",
      url: "https://accounts.google.com/oauth/authorize?..."
    },
    {
      step: 3,
      action: "User grants permissions",
      permissions: ["email", "profile"]
    },
    {
      step: 4,
      action: "Google redirects to callback URL",
      callbackUrl: "https://uyertzuadcneniblfzcs.supabase.co/auth/v1/callback"
    },
    {
      step: 5,
      action: "Supabase creates/updates user",
      creates: ["auth.users record", "profiles record"]
    },
    {
      step: 6,
      action: "Redirect to app dashboard",
      destination: "/"
    }
  ],

  scopes: {
    openid: "OpenID Connect - Identify the user",
    email: "Access to email address",
    profile: "Access to name and picture"
  },

  userDataMapping: {
    id: "sub",
    email: "email",
    name: "name",
    givenName: "given_name",
    picture: "picture",
    emailVerified: "email_verified"
  }
};

// ====================
// 5. MCP CLOUD CONSOLE CONFIGURATION
// ====================

export const mcpCloudConsoleConfig = {
  type: "mcp_cloud_console",
  version: "1.0.0",
  
  // Service Configuration
  services: {
    googleCloud: {
      projectId: "hostel-management-oauth",
      enabled: true,
      apis: [
        "google.oauth2.v2",
        "identitytoolkit.googleapis.com",
        "plus.googleapis.com"
      ]
    },
    supabase: {
      projectRef: "uyertzuadcneniblfzcs",
      enabled: true,
      region: "mumbai"
    },
    vercel: {
      projectId: "hostel-management",
      enabled: true,
      environment: ["production", "preview"]
    }
  },

  // Automation Tasks
  automationTasks: [
    {
      id: "enable-google-oauth",
      name: "Enable Google OAuth",
      service: "supabase",
      action: "updateAuthProvider",
      params: {
        provider: "google",
        enabled: true,
        clientId: "{{ GOOGLE_CLIENT_ID }}",
        clientSecret: "{{ GOOGLE_CLIENT_SECRET }}"
      },
      schedule: "manual"
    },
    {
      id: "sync-env-vars",
      name: "Sync Environment Variables",
      service: "vercel",
      action: "updateEnvironmentVariables",
      params: {
        variables: [
          "NEXT_PUBLIC_SUPABASE_URL",
          "NEXT_PUBLIC_SUPABASE_ANON_KEY",
          "NEXT_PUBLIC_GOOGLE_CLIENT_ID",
          "ADMIN_PORTAL_PASSWORD"
        ]
      },
      schedule: "on-demand"
    },
    {
      id: "test-google-auth",
      name: "Test Google Authentication",
      service: "app",
      action: "runAuthTest",
      params: {
        provider: "google",
        testUser: "test@gmail.com"
      },
      schedule: "weekly"
    }
  ],

  // Monitoring & Logging
  monitoring: {
    enableLogging: true,
    logLevel: "INFO",
    metrics: [
      "oauth_signups_daily",
      "oauth_errors_daily",
      "provider_usage"
    ],
    alerts: [
      {
        name: "High OAuth Error Rate",
        threshold: 0.05,
        notification: "email"
      }
    ]
  },

  // Security Settings
  security: {
    enforceHttpsOnly: true,
    corsAllowedOrigins: [
      "https://hostel-management-topaz-ten.vercel.app",
      "http://localhost:3000"
    ],
    rateLimiting: {
      perMinute: 100,
      perHour: 1000
    },
    csrfProtection: true,
    csrfTokenValidation: true
  }
};

// ====================
// 6. HELPER FUNCTIONS
// ====================

export const helpers = {
  /**
   * Generate OAuth callback URL
   */
  generateCallbackUrl: (provider: string, env: "dev" | "prod") => {
    const baseUrl = env === "prod"
      ? "https://hostel-management-topaz-ten.vercel.app"
      : "http://localhost:3000";
    return `${baseUrl}/auth/callback?provider=${provider}`;
  },

  /**
   * Validate OAuth credentials
   */
  validateOAuthCredentials: (clientId: string, clientSecret: string) => {
    return {
      clientIdValid: clientId && clientId.length > 0,
      clientSecretValid: clientSecret && clientSecret.length > 0,
      ready: clientId && clientSecret && clientId.length > 0 && clientSecret.length > 0
    };
  },

  /**
   * Get Google OAuth button component props
   */
  getGoogleSignInButtonProps: () => ({
    className: "google-signin-button",
    text: "Sign in with Google",
    icon: "google-icon",
    onClick: "handleGoogleSignIn",
    disabled: false
  })
};

// ====================
// 7. TESTING CONFIGURATION
// ====================

export const testingConfig = {
  googleOAuth: {
    testEmail: "test@gmail.com",
    testPassword: "TestPassword123!",
    redirectWait: 5000,
    expectations: {
      shouldCreateUser: true,
      shouldCreateProfile: true,
      shouldSetSession: true,
      shouldRedirectToHome: true
    }
  },

  supabaseWebhooks: {
    enabled: true,
    events: [
      "auth.user_created",
      "auth.user_deleted",
      "auth.user_updated"
    ]
  }
};

export default {
  googleCloudConsoleConfig,
  supabaseAuthConfig,
  environmentVariables,
  googleOAuthFlow,
  mcpCloudConsoleConfig,
  helpers,
  testingConfig
};
