import { AuthCredentials, MarketAsset, CandleData, Trade } from '../types';
import { POCKET_OPTIONS_API } from '../constants';

interface AuthResponse {
  success: boolean;
  token?: string;
  error?: string;
}

interface BalanceResponse {
  balance: number;
  currency: string;
}

interface PriceResponse {
  price: number;
  timestamp: number;
}

interface TradeResult {
  tradeId: string;
  status: string;
}

interface CloseTradeResult {
  success: boolean;
  profit?: number;
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function requestWithRetry<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`[PocketOptions] Request failed (attempt ${attempt + 1}/${retries + 1}):`, lastError.message);

      if (attempt < retries) {
        const backoff = BASE_DELAY_MS * Math.pow(2, attempt);
        console.log(`[PocketOptions] Retrying in ${backoff}ms...`);
        await delay(backoff);
      }
    }
  }

  throw lastError || new Error('Request failed after retries');
}

export class PocketOptionsClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = POCKET_OPTIONS_API.demo;
  }

  private getBaseUrl(isDemo: boolean): string {
    return isDemo ? POCKET_OPTIONS_API.demo : POCKET_OPTIONS_API.real;
  }

  private logRequest(method: string, path: string, isDemo: boolean): void {
    console.log(`[PocketOptions] ${method} ${isDemo ? 'DEMO' : 'REAL'} ${path}`);
  }

  private logResponse(method: string, path: string, status: number, body: unknown): void {
    console.log(`[PocketOptions] ${method} ${path} -> ${status}`, JSON.stringify(body).slice(0, 200));
  }

  private async fetchWithAuth(
    path: string,
    options: RequestInit,
    isDemo: boolean,
    token: string
  ): Promise<Response> {
    const url = `${this.getBaseUrl(isDemo)}${path}`;
    this.logRequest(options.method || 'GET', path, isDemo);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers as Record<string, string> || {}),
    };

    const response = await fetch(url, { ...options, headers });
    return response;
  }

  // ─── Authentication ────────────────────────────────────────────────

  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    return requestWithRetry(async () => {
      if (credentials.token) {
        this.logRequest('POST', '/api/auth/token', credentials.isDemo);

        const url = `${this.getBaseUrl(credentials.isDemo)}/api/auth/token`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: credentials.token }),
        });

        const data = await response.json();
        this.logResponse('POST', '/api/auth/token', response.status, data);

        if (response.ok && data.success) {
          this.token = credentials.token;
          return { success: true, token: credentials.token };
        }

        return { success: false, error: data.message || 'Token authentication failed' };
      }

      if (!credentials.email || !credentials.password) {
        return { success: false, error: 'Email and password are required' };
      }

      this.logRequest('POST', '/api/auth/login', credentials.isDemo);

      const url = `${this.getBaseUrl(credentials.isDemo)}/api/auth/login`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });

      const data = await response.json();
      this.logResponse('POST', '/api/auth/login', response.status, data);

      if (response.ok && data.success && data.token) {
        this.token = data.token;
        return { success: true, token: data.token };
      }

      return { success: false, error: data.message || 'Login failed' };
    });
  }

  async validateToken(token: string, isDemo: boolean): Promise<boolean> {
    try {
      this.logRequest('GET', '/api/auth/validate', isDemo);

      const url = `${this.getBaseUrl(isDemo)}/api/auth/validate`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      this.logResponse('GET', '/api/auth/validate', response.status, data);

      return response.ok && data.valid === true;
    } catch (err) {
      console.error('[PocketOptions] Token validation failed:', err);
      return false;
    }
  }

  logout(): void {
    this.token = null;
    console.log('[PocketOptions] Logged out');
  }

  // ─── Account ───────────────────────────────────────────────────────

  async getBalance(isDemo: boolean, token: string): Promise<BalanceResponse> {
    return requestWithRetry(async () => {
      const response = await this.fetchWithAuth('/api/account/balance', { method: 'GET' }, isDemo, token);

      const data = await response.json();
      this.logResponse('GET', '/api/account/balance', response.status, data);

      if (!response.ok) {
        throw new Error(data.message || `Failed to get balance: ${response.status}`);
      }

      return {
        balance: Number(data.balance) || 0,
        currency: String(data.currency || 'USD'),
      };
    });
  }

  async getProfile(isDemo: boolean, token: string): Promise<any> {
    return requestWithRetry(async () => {
      const response = await this.fetchWithAuth('/api/account/profile', { method: 'GET' }, isDemo, token);

      const data = await response.json();
      this.logResponse('GET', '/api/account/profile', response.status, data);

      if (!response.ok) {
        throw new Error(data.message || `Failed to get profile: ${response.status}`);
      }

      return data;
    });
  }

  getAccountType(): 'real' | 'demo' {
    return this.baseUrl.includes('demo') ? 'demo' : 'real';
  }

  // ─── Markets ───────────────────────────────────────────────────────

  async getMarkets(isDemo: boolean, token: string): Promise<MarketAsset[]> {
    return requestWithRetry(async () => {
      const response = await this.fetchWithAuth('/api/markets', { method: 'GET' }, isDemo, token);

      const data = await response.json();
      this.logResponse('GET', '/api/markets', response.status, data);

      if (!response.ok) {
        throw new Error(data.message || `Failed to get markets: ${response.status}`);
      }

      const markets: MarketAsset[] = Array.isArray(data) ? data : (data.markets || data.assets || []);

      return markets.map((m: any) => ({
        id: String(m.id || m.asset_id || ''),
        name: String(m.name || m.asset_name || ''),
        symbol: String(m.symbol || m.ticker || ''),
        category: String(m.category || m.type || 'Unknown'),
        payout: Number(m.payout || m.payout_percent || 0),
        isActive: Boolean(m.is_active ?? m.active ?? true),
        spread: Number(m.spread || 0),
      }));
    });
  }

  async getMarketPayout(assetId: string, isDemo: boolean, token: string): Promise<number> {
    return requestWithRetry(async () => {
      const response = await this.fetchWithAuth(
        `/api/markets/${encodeURIComponent(assetId)}/payout`,
        { method: 'GET' },
        isDemo,
        token
      );

      const data = await response.json();
      this.logResponse('GET', `/api/markets/${assetId}/payout`, response.status, data);

      if (!response.ok) {
        throw new Error(data.message || `Failed to get payout for ${assetId}: ${response.status}`);
      }

      return Number(data.payout || data.payout_percent || 0);
    });
  }

  async isMarketOpen(assetId: string, isDemo: boolean, token: string): Promise<boolean> {
    try {
      const response = await this.fetchWithAuth(
        `/api/markets/${encodeURIComponent(assetId)}/status`,
        { method: 'GET' },
        isDemo,
        token
      );

      const data = await response.json();
      this.logResponse('GET', `/api/markets/${assetId}/status`, response.status, data);

      return response.ok && Boolean(data.is_open ?? data.open ?? data.active ?? false);
    } catch {
      return false;
    }
  }

  // ─── Historical Data ───────────────────────────────────────────────

  async getCandles(
    assetId: string,
    timeframe: number,
    count: number,
    isDemo: boolean,
    token: string
  ): Promise<CandleData[]> {
    return requestWithRetry(async () => {
      const params = new URLSearchParams({
        timeframe: String(timeframe),
        count: String(count),
      });

      const path = `/api/candles/${encodeURIComponent(assetId)}?${params.toString()}`;
      const response = await this.fetchWithAuth(path, { method: 'GET' }, isDemo, token);

      const data = await response.json();
      this.logResponse('GET', path, response.status, data);

      if (!response.ok) {
        throw new Error(data.message || `Failed to get candles for ${assetId}: ${response.status}`);
      }

      const candles: any[] = Array.isArray(data) ? data : (data.candles || data.data || []);

      return candles.map((c: any) => ({
        timestamp: Number(c.timestamp || c.time || c.t || 0),
        open: Number(c.open || c.o || 0),
        high: Number(c.high || c.h || 0),
        low: Number(c.low || c.l || 0),
        close: Number(c.close || c.c || 0),
        volume: Number(c.volume || c.v || 0),
      }));
    });
  }

  async getPrice(assetId: string, isDemo: boolean, token: string): Promise<PriceResponse> {
    return requestWithRetry(async () => {
      const response = await this.fetchWithAuth(
        `/api/prices/${encodeURIComponent(assetId)}`,
        { method: 'GET' },
        isDemo,
        token
      );

      const data = await response.json();
      this.logResponse('GET', `/api/prices/${assetId}`, response.status, data);

      if (!response.ok) {
        throw new Error(data.message || `Failed to get price for ${assetId}: ${response.status}`);
      }

      return {
        price: Number(data.price || data.current_price || 0),
        timestamp: Number(data.timestamp || data.time || Date.now()),
      };
    });
  }

  // ─── Trading ───────────────────────────────────────────────────────

  async placeTrade(
    assetId: string,
    direction: 'CALL' | 'PUT',
    amount: number,
    expiry: number,
    isDemo: boolean,
    token: string
  ): Promise<TradeResult> {
    return requestWithRetry(async () => {
      const body = JSON.stringify({
        asset_id: assetId,
        direction,
        amount,
        expiry,
      });

      const response = await this.fetchWithAuth(
        '/api/trade/open',
        { method: 'POST', body },
        isDemo,
        token
      );

      const data = await response.json();
      this.logResponse('POST', '/api/trade/open', response.status, data);

      if (!response.ok) {
        throw new Error(data.message || `Failed to place trade: ${response.status}`);
      }

      return {
        tradeId: String(data.trade_id || data.id || ''),
        status: String(data.status || 'OPEN'),
      };
    });
  }

  async closeTrade(tradeId: string, isDemo: boolean, token: string): Promise<CloseTradeResult> {
    return requestWithRetry(async () => {
      const body = JSON.stringify({ trade_id: tradeId });

      const response = await this.fetchWithAuth(
        '/api/trade/close',
        { method: 'POST', body },
        isDemo,
        token
      );

      const data = await response.json();
      this.logResponse('POST', '/api/trade/close', response.status, data);

      if (!response.ok) {
        throw new Error(data.message || `Failed to close trade: ${response.status}`);
      }

      return {
        success: Boolean(data.success ?? response.ok),
        profit: data.profit !== undefined ? Number(data.profit) : undefined,
      };
    });
  }

  async getOpenTrades(isDemo: boolean, token: string): Promise<Trade[]> {
    return requestWithRetry(async () => {
      const response = await this.fetchWithAuth('/api/trades/open', { method: 'GET' }, isDemo, token);

      const data = await response.json();
      this.logResponse('GET', '/api/trades/open', response.status, data);

      if (!response.ok) {
        throw new Error(data.message || `Failed to get open trades: ${response.status}`);
      }

      const trades: any[] = Array.isArray(data) ? data : (data.trades || []);

      return trades.map((t: any) => ({
        id: String(t.id || t.trade_id || ''),
        assetId: String(t.asset_id || t.asset || ''),
        assetName: String(t.asset_name || t.symbol || ''),
        direction: (String(t.direction || 'CALL').toUpperCase() as 'CALL' | 'PUT'),
        amount: Number(t.amount || t.stake || 0),
        entryPrice: Number(t.entry_price || t.open_price || 0),
        exitPrice: t.exit_price ? Number(t.exit_price) : undefined,
        expiry: Number(t.expiry || t.duration || 60),
        openTime: Number(t.open_time || t.created_at || t.timestamp || 0),
        closeTime: t.close_time ? Number(t.close_time) : undefined,
        status: (String(t.status || 'OPEN').toUpperCase() as Trade['status']),
        profit: t.profit !== undefined ? Number(t.profit) : undefined,
        payout: t.payout !== undefined ? Number(t.payout) : undefined,
      }));
    });
  }

  async getTradeHistory(isDemo: boolean, token: string, page: number = 1): Promise<Trade[]> {
    return requestWithRetry(async () => {
      const params = new URLSearchParams({ page: String(page) });
      const path = `/api/trades/history?${params.toString()}`;
      const response = await this.fetchWithAuth(path, { method: 'GET' }, isDemo, token);

      const data = await response.json();
      this.logResponse('GET', path, response.status, data);

      if (!response.ok) {
        throw new Error(data.message || `Failed to get trade history: ${response.status}`);
      }

      const trades: any[] = Array.isArray(data) ? data : (data.trades || data.history || []);

      return trades.map((t: any) => ({
        id: String(t.id || t.trade_id || ''),
        assetId: String(t.asset_id || t.asset || ''),
        assetName: String(t.asset_name || t.symbol || ''),
        direction: (String(t.direction || 'CALL').toUpperCase() as 'CALL' | 'PUT'),
        amount: Number(t.amount || t.stake || 0),
        entryPrice: Number(t.entry_price || t.open_price || 0),
        exitPrice: t.exit_price ? Number(t.exit_price) : undefined,
        expiry: Number(t.expiry || t.duration || 60),
        openTime: Number(t.open_time || t.created_at || t.timestamp || 0),
        closeTime: t.close_time ? Number(t.close_time) : undefined,
        status: (String(t.status || 'OPEN').toUpperCase() as Trade['status']),
        profit: t.profit !== undefined ? Number(t.profit) : undefined,
        payout: t.payout !== undefined ? Number(t.payout) : undefined,
      }));
    });
  }
}
