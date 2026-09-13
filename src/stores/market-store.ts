import { create } from 'zustand';
import type { MarketAsset, CandleData } from '../types';

interface MarketStore {
  assets: MarketAsset[];
  priceData: Map<string, number>;
  candleData: Map<string, CandleData[]>;
  selectedMarkets: string[];
  watchlist: string[];

  setAssets: (assets: MarketAsset[]) => void;
  updatePrice: (assetId: string, price: number) => void;
  setCandles: (assetId: string, candles: CandleData[]) => void;
  appendCandle: (assetId: string, candle: CandleData) => void;
  toggleMarketSelection: (assetId: string) => void;
  setSelectedMarkets: (markets: string[]) => void;
  addToWatchlist: (assetId: string) => void;
  removeFromWatchlist: (assetId: string) => void;
  getAssetPrice: (assetId: string) => number;
}

export const useMarketStore = create<MarketStore>((set, get) => ({
  assets: [],
  priceData: new Map(),
  candleData: new Map(),
  selectedMarkets: [],
  watchlist: [],

  setAssets: (assets) => set({ assets }),

  updatePrice: (assetId, price) =>
    set((state) => {
      const newPriceData = new Map(state.priceData);
      newPriceData.set(assetId, price);
      return { priceData: newPriceData };
    }),

  setCandles: (assetId, candles) =>
    set((state) => {
      const newCandleData = new Map(state.candleData);
      newCandleData.set(assetId, candles);
      return { candleData: newCandleData };
    }),

  appendCandle: (assetId, candle) =>
    set((state) => {
      const newCandleData = new Map(state.candleData);
      const existing = newCandleData.get(assetId) || [];
      const updated = [...existing, candle].slice(-500);
      newCandleData.set(assetId, updated);
      return { candleData: newCandleData };
    }),

  toggleMarketSelection: (assetId) =>
    set((state) => {
      const idx = state.selectedMarkets.indexOf(assetId);
      if (idx >= 0) {
        return { selectedMarkets: state.selectedMarkets.filter((m) => m !== assetId) };
      }
      return { selectedMarkets: [...state.selectedMarkets, assetId] };
    }),

  setSelectedMarkets: (markets) => set({ selectedMarkets: markets }),

  addToWatchlist: (assetId) =>
    set((state) => {
      if (state.watchlist.includes(assetId)) return {};
      return { watchlist: [...state.watchlist, assetId] };
    }),

  removeFromWatchlist: (assetId) =>
    set((state) => ({
      watchlist: state.watchlist.filter((m) => m !== assetId),
    })),

  getAssetPrice: (assetId) => {
    return get().priceData.get(assetId) || 0;
  },
}));
