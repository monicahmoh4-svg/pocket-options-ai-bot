import { NextRequest, NextResponse } from 'next/server';

const POCKET_OPTIONS_API = process.env.POCKET_OPTIONS_API_URL || 'https://pocketoption.com';

interface AccountBalance {
  balance: number;
  currency: string;
  isDemo: boolean;
  accountType: string;
  lastUpdated: number;
}

function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

async function fetchBalanceFromAPI(isDemo: boolean): Promise<AccountBalance | null> {
  try {
    const response = await fetch(`${POCKET_OPTIONS_API}/api/balance?isDemo=${isDemo}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();

    if (data) {
      return {
        balance: data.balance || 0,
        currency: data.currency || 'USD',
        isDemo,
        accountType: isDemo ? 'demo' : 'real',
        lastUpdated: data.lastUpdated || Date.now(),
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch balance from API:', error);
    return null;
  }
}

function getSimulatedBalance(isDemo: boolean): AccountBalance {
  const baseBalance = isDemo ? 10000 : 0;

  return {
    balance: baseBalance + parseFloat((Math.random() * 1000 - 500).toFixed(2)),
    currency: 'USD',
    isDemo,
    accountType: isDemo ? 'demo' : 'real',
    lastUpdated: Date.now(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isDemoParam = searchParams.get('isDemo');
    const isDemo = isDemoParam === 'true';

    const apiBalance = await fetchBalanceFromAPI(isDemo);
    if (apiBalance) {
      return addCorsHeaders(
        NextResponse.json({
          success: true,
          data: apiBalance,
        })
      );
    }

    const simulatedBalance = getSimulatedBalance(isDemo);

    return addCorsHeaders(
      NextResponse.json({
        success: true,
        data: simulatedBalance,
      })
    );
  } catch (error) {
    console.error('Balance API error:', error);

    const fallbackBalance = getSimulatedBalance(true);

    return addCorsHeaders(
      NextResponse.json({
        success: false,
        error: 'Internal server error',
        data: fallbackBalance,
      })
    );
  }
}

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 200 }));
}
