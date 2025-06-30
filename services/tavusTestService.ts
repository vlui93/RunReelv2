/**
 * Test service to validate Tavus API connectivity with minimal request
 * Use this to debug Tavus API issues before implementing full video generation
 */

interface TavusTestResult {
  success: boolean;
  error?: string;
  data?: any;
}

export const testTavusConnection = async (): Promise<TavusTestResult> => {
  const apiKey = process.env.EXPO_PUBLIC_TAVUS_API_KEY;
  const replicaId = process.env.EXPO_PUBLIC_TAVUS_REPLICA_ID;

  if (!apiKey) {
    return {
      success: false,
      error: 'EXPO_PUBLIC_TAVUS_API_KEY environment variable is missing'
    };
  }

  if (!replicaId) {
    return {
      success: false,
      error: 'EXPO_PUBLIC_TAVUS_REPLICA_ID environment variable is missing'
    };
  }

  try {
    // Test with absolute minimum required fields only
    const minimalRequest = {
      replica_id: replicaId,
      script: "This is a test video to verify API connectivity and replica status."
    };

    console.log('🧪 Testing Tavus API with minimal request:', minimalRequest);

    const response = await fetch('https://tavusapi.com/v2/videos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify(minimalRequest)
    });

    const responseText = await response.text();
    console.log('📡 Tavus API response:', {
      status: response.status,
      statusText: response.statusText,
      body: responseText
    });

    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log('✅ Tavus API test successful');
      return { 
        success: true, 
        data: {
          video_id: result.video_id,
          status: result.status,
          message: 'Tavus API is working correctly'
        }
      };
    } else {
      console.error('❌ Tavus API test failed');
      return { 
        success: false, 
        error: `HTTP ${response.status}: ${responseText}` 
      };
    }

  } catch (error) {
    console.error('❌ Tavus connection test error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

export const validateTavusEnvironment = (): { valid: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  if (!process.env.EXPO_PUBLIC_TAVUS_API_KEY) {
    issues.push('Missing EXPO_PUBLIC_TAVUS_API_KEY environment variable');
  }
  
  if (!process.env.EXPO_PUBLIC_TAVUS_REPLICA_ID) {
    issues.push('Missing EXPO_PUBLIC_TAVUS_REPLICA_ID environment variable');
  }

  return {
    valid: issues.length === 0,
    issues
  };
};