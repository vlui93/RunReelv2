declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_SUPABASE_URL: string;
      EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
      EXPO_PUBLIC_TAVUS_API_KEY: string;
      EXPO_PUBLIC_GOOGLE_FIT_CLIENT_ID: string;
      EXPO_PUBLIC_APPLE_HEALTH_PERMISSIONS: string;
    }
  }
}

export {};