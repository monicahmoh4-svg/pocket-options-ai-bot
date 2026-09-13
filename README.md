# Pocket Options AI Trading Bot

An AI-powered autonomous trading bot for Pocket Options with real-time market scanning, signal generation, and automatic trade execution.

## Features

- **AI Signal Generation** - Multi-indicator analysis using RSI, MACD, Bollinger Bands, Stochastic, EMA, Ichimoku, Fibonacci, and more
- **Real-Time Market Scanning** - Live scanning of all Pocket Options markets for profitable opportunities
- **Autonomous Trade Execution** - Bot automatically executes trades when signals are high confidence
- **Risk Management** - Configurable stop loss, target profit, stake limits, and martingale settings
- **Live Dashboard** - Real-time balance, P&L, trade history, and trend charts
- **Demo & Real Modes** - Practice with demo account or trade with real funds
- **AI Recommendations** - Smart advisor providing trade recommendations with risk scores
- **Responsive Design** - Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS, Recharts
- **State**: Zustand
- **Backend**: Next.js API Routes
- **Connection**: WebSocket to Pocket Options API
- **Deployment**: Vercel

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.local.example` to `.env.local` and fill in your credentials
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000)

## Deployment on Vercel

1. Push this repository to GitHub
2. Import the project on [Vercel](https://vercel.com)
3. Set environment variables in Vercel dashboard
4. Deploy

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `POCKET_OPTIONS_AUTH_TOKEN` | Your Pocket Options auth token | Yes |
| `POCKET_OPTIONS_ENV` | `real` or `demo` | Yes |
| `GOOGLE_AI_API_KEY` | Google Gemini AI key for enhanced signals | No |

## Trading Algorithms

The bot uses 10+ technical indicators with weighted consensus:

1. **RSI** - Relative Strength Index with divergence detection
2. **MACD** - Moving Average Convergence Divergence crossovers
3. **Bollinger Bands** - Volatility squeeze and breakout detection
4. **Stochastic Oscillator** - Overbought/oversold with K/D crossover
5. **EMA Crossover** - 5/20 Exponential Moving Average
6. **Support/Resistance** - Pivot point and historical level detection
7. **Volume Analysis** - OBV trend and volume spike detection
8. **Trend Momentum** - ADX trend strength measurement
9. **Ichimoku Cloud** - Cloud breakout signals
10. **Fibonacci Retracement** - Key level proximity detection

## Disclaimer

Trading binary options involves substantial risk. This bot is provided as-is. Users are responsible for their own trading decisions. Never trade with money you cannot afford to lose.
