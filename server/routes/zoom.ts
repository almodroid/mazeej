import crypto from 'crypto';

export interface ZoomMeetingOptions {
  topic: string;
  type: 1 | 2 | 3 | 8; // 1=instant, 2=scheduled, 3=recurring with no fixed time, 8=recurring with fixed time
  startTime?: string;
  duration?: number;
  timezone?: string;
  password?: string;
  agenda?: string;
}

/**
 * Generates a Zoom meeting token
 * Note: You need to set ZOOM_SDK_KEY and ZOOM_SDK_SECRET environment variables
 */
export function generateZoomToken(userId: string, expiresIn: number = 3600): string {
  // These values come from your Zoom Developer account
  const sdkKey = process.env.ZOOM_SDK_KEY;
  const sdkSecret = process.env.ZOOM_SDK_SECRET;

  if (!sdkKey || !sdkSecret) {
    throw new Error('Missing Zoom SDK credentials. Please set ZOOM_SDK_KEY and ZOOM_SDK_SECRET environment variables.');
  }

  const iat = Math.round(Date.now() / 1000);
  const exp = iat + expiresIn;
  
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const payload = {
    appKey: sdkKey,
    sdkKey: sdkKey,
    mn: '', // Meeting number (empty for now)
    role: 0, // 0 for participant, 1 for host
    iat: iat,
    exp: exp,
    tokenExp: exp
  };
  
  const headerStr = Buffer.from(JSON.stringify(header)).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  const signature = crypto.createHmac('sha256', sdkSecret)
    .update(`${headerStr}.${payloadStr}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  return `${headerStr}.${payloadStr}.${signature}`;
}

/**
 * Creates a Zoom meeting through the Zoom API
 * Note: You need to set ZOOM_SDK_KEY and ZOOM_SDK_SECRET environment variables
 */
export async function createZoomMeeting(options: ZoomMeetingOptions): Promise<any> {
  const sdkKey = process.env.ZOOM_SDK_KEY;
  const sdkSecret = process.env.ZOOM_SDK_SECRET;

  if (!sdkKey || !sdkSecret) {
    throw new Error('Missing Zoom SDK credentials. Please set ZOOM_SDK_KEY and ZOOM_SDK_SECRET environment variables.');
  }

  // Generate a JWT token for Zoom API
  const token = generateZoomToken('API', 60 * 60); // 1 hour token
  
  try {
    const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(options)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create Zoom meeting: ${response.status} ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating Zoom meeting:', error);
    throw error;
  }
}