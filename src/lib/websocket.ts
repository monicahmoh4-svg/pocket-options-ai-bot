import { WSMessage } from '../types';
import { POCKET_OPTIONS_WS_URLS, WS_EVENTS } from '../constants';

type EventCallback = (data: any) => void;

interface QueuedMessage {
  message: string;
  timestamp: number;
}

interface WSConfig {
  token: string;
  isDemo: boolean;
  pingInterval?: number;
  reconnectBaseDelay?: number;
  reconnectMaxDelay?: number;
  maxReconnectAttempts?: number;
  messageQueueLimit?: number;
}

const DEFAULT_CONFIG: Required<WSConfig> = {
  token: '',
  isDemo: true,
  pingInterval: 30000,
  reconnectBaseDelay: 1000,
  reconnectMaxDelay: 30000,
  maxReconnectAttempts: 20,
  messageQueueLimit: 500,
};

export class PocketOptionsWebSocket {
  private ws: WebSocket | null = null;
  private config: Required<WSConfig>;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private messageQueue: QueuedMessage[] = [];
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private pongTimer: ReturnType<typeof setTimeout> | null = null;
  private isAuthenticated = false;
  private isManualDisconnect = false;
  private subscribedAssets: Set<string> = new Set();
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'authenticating' = 'disconnected';
  private pendingRequests: Map<string, { resolve: (v: any) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> }> = new Map();
  private requestId = 0;

  constructor(config: Partial<WSConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private get wsUrl(): string {
    return this.config.isDemo
      ? POCKET_OPTIONS_WS_URLS.demo
      : POCKET_OPTIONS_WS_URLS.real;
  }

  private generateRequestId(): string {
    return `req_${++this.requestId}_${Date.now()}`;
  }

  private generateSignature(payload: string): string {
    let hash = 0;
    const timestamp = Date.now();
    const data = `${this.config.token}:${payload}:${timestamp}`;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `${Math.abs(hash).toString(16)}_${timestamp}`;
  }

  private signMessage(message: object): string {
    const payload = JSON.stringify(message);
    const signature = this.generateSignature(payload);
    return JSON.stringify({ ...message, signature });
  }

  connect(): void {
    if (this.connectionStatus === 'connecting' || this.connectionStatus === 'connected') {
      return;
    }

    this.isManualDisconnect = false;
    this.connectionStatus = 'connecting';
    this.emit(WS_EVENTS.CONNECT, { status: 'connecting' });

    try {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
    } catch (error) {
      this.connectionStatus = 'disconnected';
      this.emit(WS_EVENTS.ERROR, { message: 'Failed to create WebSocket', error });
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    this.isManualDisconnect = true;
    this.clearTimers();
    this.reconnectAttempts = 0;
    this.isAuthenticated = false;
    this.connectionStatus = 'disconnected';
    this.subscribedAssets.clear();
    this.rejectAllPending('Disconnected by user');

    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close(1000, 'User disconnect');
      this.ws = null;
    }

    this.emit(WS_EVENTS.DISCONNECT, { reason: 'manual' });
  }

  private handleOpen(): void {
    this.connectionStatus = 'authenticating';
    this.reconnectAttempts = 0;
    this.authenticate();
  }

  private authenticate(): void {
    const authMessage = {
      type: 'auth',
      payload: {
        token: this.config.token,
        isDemo: this.config.isDemo,
      },
      timestamp: Date.now(),
    };

    this.sendRaw(authMessage);
  }

  private handleMessage(event: MessageEvent): void {
    let raw: string;
    if (typeof event.data === 'string') {
      raw = event.data;
    } else if (event.data instanceof Blob) {
      event.data.text().then((text) => this.processRawMessage(text));
      return;
    } else {
      raw = String(event.data);
    }
    this.processRawMessage(raw);
  }

  private processRawMessage(raw: string): void {
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      this.emit(WS_EVENTS.ERROR, { message: 'Invalid JSON received', raw });
      return;
    }

    if (parsed.type === 'pong') {
      this.handlePong();
      return;
    }

    if (parsed.type === 'auth_success' || parsed.type === 'authenticated') {
      this.handleAuthSuccess(parsed);
      return;
    }

    if (parsed.type === 'auth_failed' || parsed.type === 'auth_error') {
      this.handleAuthFailure(parsed);
      return;
    }

    if (parsed.type === 'error') {
      this.emit(WS_EVENTS.ERROR, parsed.payload || parsed);
      this.rejectPendingById(parsed.requestId, new Error(parsed.message || 'Server error'));
      return;
    }

    if (parsed.requestId && this.pendingRequests.has(parsed.requestId)) {
      const pending = this.pendingRequests.get(parsed.requestId)!;
      clearTimeout(pending.timer);
      this.pendingRequests.delete(parsed.requestId);
      if (parsed.error || parsed.type === 'error') {
        pending.reject(new Error(parsed.message || 'Request failed'));
      } else {
        pending.resolve(parsed.payload || parsed);
      }
      return;
    }

    this.routeMessage(parsed);
  }

  private handleAuthSuccess(parsed: any): void {
    this.isAuthenticated = true;
    this.connectionStatus = 'connected';
    this.emit(WS_EVENTS.AUTH_SUCCESS, parsed.payload || {});
    this.flushQueue();
    this.resubscribeAll();
    this.startPing();
  }

  private handleAuthFailure(parsed: any): void {
    this.isAuthenticated = false;
    this.connectionStatus = 'disconnected';
    this.emit(WS_EVENTS.AUTH_FAILED, parsed.payload || parsed);
    this.rejectAllPending('Authentication failed');
  }

  private routeMessage(message: any): void {
    const type: string = message.type || '';
    const payload = message.payload !== undefined ? message.payload : message;

    const eventMap: Record<string, string> = {
      'price': WS_EVENTS.PRICE_UPDATE,
      'prices': WS_EVENTS.PRICE_UPDATE,
      'price_update': WS_EVENTS.PRICE_UPDATE,
      'candle': WS_EVENTS.CANDLE_UPDATE,
      'candles': WS_EVENTS.CANDLE_UPDATE,
      'candle_update': WS_EVENTS.CANDLE_UPDATE,
      'balance': WS_EVENTS.BALANCE_UPDATE,
      'balance_update': WS_EVENTS.BALANCE_UPDATE,
      'trade_opened': WS_EVENTS.TRADE_OPENED,
      'trade_open': WS_EVENTS.TRADE_OPENED,
      'trade_closed': WS_EVENTS.TRADE_CLOSED,
      'trade_close': WS_EVENTS.TRADE_CLOSED,
      'trade_result': WS_EVENTS.TRADE_RESULT,
      'trade': WS_EVENTS.TRADE_RESULT,
      'market_list': WS_EVENTS.MARKET_LIST,
      'markets': WS_EVENTS.MARKET_LIST,
      'instruments': WS_EVENTS.MARKET_LIST,
      'ping': WS_EVENTS.CONNECT,
    };

    const eventName = eventMap[type] || type;
    this.emit(eventName, payload);

    const wsMessage: WSMessage = {
      type: eventName,
      payload,
      timestamp: message.timestamp || Date.now(),
    };
    this.emit('message', wsMessage);
  }

  private handleClose(event: CloseEvent): void {
    this.clearTimers();
    this.rejectAllPending(`Connection closed: ${event.code} ${event.reason}`);
    this.connectionStatus = 'disconnected';
    this.isAuthenticated = false;

    if (!this.isManualDisconnect) {
      this.emit(WS_EVENTS.DISCONNECT, { code: event.code, reason: event.reason });
      this.scheduleReconnect();
    }
  }

  private handleError(event: Event): void {
    this.emit(WS_EVENTS.ERROR, { message: 'WebSocket error', event });
  }

  private sendRaw(message: object): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.queueMessage(JSON.stringify(message));
      return;
    }
    try {
      const signed = this.signMessage(message);
      this.ws.send(signed);
    } catch (error) {
      this.emit(WS_EVENTS.ERROR, { message: 'Failed to send message', error });
    }
  }

  private queueMessage(raw: string): void {
    if (this.messageQueue.length >= this.config.messageQueueLimit) {
      this.messageQueue.shift();
    }
    this.messageQueue.push({ message: raw, timestamp: Date.now() });
  }

  private flushQueue(): void {
    const queue = [...this.messageQueue];
    this.messageQueue = [];
    for (const queued of queue) {
      if (Date.now() - queued.timestamp > 60000) continue;
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        this.messageQueue.push(queued);
        continue;
      }
      try {
        this.ws.send(queued.message);
      } catch {
        this.messageQueue.push(queued);
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.emit(WS_EVENTS.ERROR, { message: 'Max reconnection attempts reached' });
      return;
    }

    const delay = Math.min(
      this.config.reconnectBaseDelay * Math.pow(2, this.reconnectAttempts) + Math.random() * 1000,
      this.config.reconnectMaxDelay
    );
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startPing(): void {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      this.sendPing();
    }, this.config.pingInterval);
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private sendPing(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.pongTimer = setTimeout(() => {
      this.emit(WS_EVENTS.ERROR, { message: 'Pong timeout, connection may be dead' });
      this.ws?.close(4000, 'Pong timeout');
    }, 10000);

    try {
      this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
    } catch {
      clearTimeout(this.pongTimer!);
      this.pongTimer = null;
    }
  }

  private handlePong(): void {
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }
  }

  private clearTimers(): void {
    this.stopPing();
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private resubscribeAll(): void {
    for (const assetId of this.subscribedAssets) {
      this.sendSubscribe(assetId);
    }
  }

  private sendSubscribe(assetId: string): void {
    this.sendRaw({
      type: 'subscribe',
      payload: { assetId },
      timestamp: Date.now(),
    });
  }

  private sendUnsubscribe(assetId: string): void {
    this.sendRaw({
      type: 'unsubscribe',
      payload: { assetId },
      timestamp: Date.now(),
    });
  }

  private sendWithResponse(message: object, timeout = 10000): Promise<any> {
    const requestId = this.generateRequestId();
    const fullMessage = { ...message, requestId };

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('Request timed out'));
      }, timeout);

      this.pendingRequests.set(requestId, { resolve, reject, timer });

      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        this.queueMessage(JSON.stringify(fullMessage));
      } else {
        try {
          const signed = this.signMessage(fullMessage);
          this.ws.send(signed);
        } catch (error) {
          clearTimeout(timer);
          this.pendingRequests.delete(requestId);
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      }
    });
  }

  private rejectAllPending(reason: string): void {
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timer);
      pending.reject(new Error(reason));
    }
    this.pendingRequests.clear();
  }

  private rejectPendingById(requestId: string | undefined, error: Error): void {
    if (!requestId) return;
    const pending = this.pendingRequests.get(requestId);
    if (pending) {
      clearTimeout(pending.timer);
      pending.reject(error);
      this.pendingRequests.delete(requestId);
    }
  }

  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  off(event: string, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      for (const cb of callbacks) {
        try {
          cb(data);
        } catch (error) {
          console.error(`Error in event listener for '${event}':`, error);
        }
      }
    }
  }

  subscribe(assetId: string): void {
    this.subscribedAssets.add(assetId);
    if (this.isAuthenticated && this.ws?.readyState === WebSocket.OPEN) {
      this.sendSubscribe(assetId);
    }
  }

  unsubscribe(assetId: string): void {
    this.subscribedAssets.delete(assetId);
    if (this.isAuthenticated && this.ws?.readyState === WebSocket.OPEN) {
      this.sendUnsubscribe(assetId);
    }
  }

  placeTrade(
    direction: 'CALL' | 'PUT',
    amount: number,
    assetId: string,
    expiry: number
  ): Promise<any> {
    return this.sendWithResponse({
      type: 'trade',
      payload: {
        action: direction,
        amount,
        assetId,
        expiry,
      },
      timestamp: Date.now(),
    }, 15000);
  }

  getBalance(): Promise<any> {
    return this.sendWithResponse({
      type: 'get_balance',
      payload: {},
      timestamp: Date.now(),
    }, 10000);
  }

  getOpenTrades(): Promise<any> {
    return this.sendWithResponse({
      type: 'get_open_trades',
      payload: {},
      timestamp: Date.now(),
    }, 10000);
  }

  closeTrade(tradeId: string): Promise<any> {
    return this.sendWithResponse({
      type: 'close_trade',
      payload: { tradeId },
      timestamp: Date.now(),
    }, 10000);
  }

  getConnectionStatus(): string {
    return this.connectionStatus;
  }

  isAuthenticatedUser(): boolean {
    return this.isAuthenticated;
  }

  getSubscribedAssets(): string[] {
    return Array.from(this.subscribedAssets);
  }

  getMessageQueueLength(): number {
    return this.messageQueue.length;
  }

  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }
}
