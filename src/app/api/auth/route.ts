import { NextRequest, NextResponse } from 'next/server';

const POCKET_OPTIONS_API = process.env.POCKET_OPTIONS_API_URL || 'https://pocketoption.com';

interface SessionData {
  token: string;
  isDemo: boolean;
  userId?: string;
  email?: string;
  expiresAt: number;
}

const sessions = new Map<string, SessionData>();

function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

function generateSessionToken(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

async function validateToken(token: string, isDemo: boolean): Promise<boolean> {
  try {
    const response = await fetch(`${POCKET_OPTIONS_API}/api/auth/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ isDemo }),
    });

    return response.ok;
  } catch {
    return false;
  }
}

async function authenticateWithEmail(
  email: string,
  password: string,
  isDemo: boolean
): Promise<{ token?: string; error?: string; userId?: string }> {
  try {
    const endpoint = isDemo
      ? `${POCKET_OPTIONS_API}/api/auth/demo-login`
      : `${POCKET_OPTIONS_API}/api/auth/login`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, isDemo }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { error: errorData.message || 'Authentication failed' };
    }

    const data = await response.json();
    return {
      token: data.token,
      userId: data.userId,
    };
  } catch (error) {
    return { error: 'Network error during authentication' };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, token, isDemo = false } = body;

    if (!token && (!email || !password)) {
      return addCorsHeaders(
        NextResponse.json(
          { success: false, error: 'Either token or email/password is required' },
          { status: 400 }
        )
      );
    }

    let authToken: string | undefined;
    let userId: string | undefined;

    if (token) {
      const isValid = await validateToken(token, isDemo);
      if (!isValid) {
        return addCorsHeaders(
          NextResponse.json(
            { success: false, error: 'Invalid or expired token' },
            { status: 401 }
          )
        );
      }
      authToken = token;
    } else {
      const authResult = await authenticateWithEmail(email!, password!, isDemo);
      if (authResult.error) {
        return addCorsHeaders(
          NextResponse.json(
            { success: false, error: authResult.error },
            { status: 401 }
          )
        );
      }
      authToken = authResult.token;
      userId = authResult.userId;
    }

    if (!authToken) {
      return addCorsHeaders(
        NextResponse.json(
          { success: false, error: 'Failed to obtain authentication token' },
          { status: 500 }
        )
      );
    }

    const sessionToken = generateSessionToken();
    const sessionData: SessionData = {
      token: authToken,
      isDemo,
      userId,
      email,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };

    sessions.set(sessionToken, sessionData);

    const response = NextResponse.json({
      success: true,
      token: authToken,
      sessionToken,
      isDemo,
      expiresAt: sessionData.expiresAt,
    });

    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/',
    });

    return addCorsHeaders(response);
  } catch (error) {
    console.error('Auth API error:', error);
    return addCorsHeaders(
      NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return addCorsHeaders(
        NextResponse.json(
          { success: false, error: 'No active session' },
          { status: 401 }
        )
      );
    }

    const session = sessions.get(sessionToken);

    if (!session || session.expiresAt < Date.now()) {
      sessions.delete(sessionToken);
      return addCorsHeaders(
        NextResponse.json(
          { success: false, error: 'Session expired' },
          { status: 401 }
        )
      );
    }

    return addCorsHeaders(
      NextResponse.json({
        success: true,
        isDemo: session.isDemo,
        email: session.email,
        userId: session.userId,
        expiresAt: session.expiresAt,
      })
    );
  } catch (error) {
    console.error('Auth session check error:', error);
    return addCorsHeaders(
      NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value;

    if (sessionToken) {
      sessions.delete(sessionToken);
    }

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    response.cookies.delete('session_token');

    return addCorsHeaders(response);
  } catch (error) {
    console.error('Logout error:', error);
    return addCorsHeaders(
      NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    );
  }
}

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 200 }));
}
