'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TradingRules } from '../types';
import { EXPIRY_OPTIONS, POPULAR_ASSETS } from '../constants';

interface TradingRulesProps {
  rules: TradingRules;
  onSave: (rules: TradingRules) => void;
}

const DEFAULT_RULES: TradingRules = {
  maxStake: 100,
  minStake: 1,
  stakeAmount: 10,
  targetProfit: 50,
  stopLoss: 100,
  maxConcurrentTrades: 3,
  tradingExpiry: 60,
  minSignalStrength: 70,
  minConfidence: 65,
  allowedMarkets: [],
  tradingSession: {
    start: '08:00',
    end: '22:00',
  },
  martingale: false,
  martingaleMultiplier: 1.5,
  maxMartingaleSteps: 3,
};

export default function TradingRulesComponent({ rules, onSave }: TradingRulesProps) {
  const [formData, setFormData] = useState<TradingRules>({ ...rules });
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: keyof TradingRules, value: any) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      setHasChanges(JSON.stringify(newData) !== JSON.stringify(rules));
      return newData;
    });
  };

  const handleSessionChange = (field: 'start' | 'end', value: string) => {
    setFormData((prev) => {
      const newData = {
        ...prev,
        tradingSession: { ...prev.tradingSession, [field]: value },
      };
      setHasChanges(JSON.stringify(newData) !== JSON.stringify(rules));
      return newData;
    });
  };

  const handleMarketToggle = (marketId: string) => {
    setFormData((prev) => {
      const currentMarkets = prev.allowedMarkets;
      const newMarkets = currentMarkets.includes(marketId)
        ? currentMarkets.filter((id) => id !== marketId)
        : [...currentMarkets, marketId];
      const newData = { ...prev, allowedMarkets: newMarkets };
      setHasChanges(JSON.stringify(newData) !== JSON.stringify(rules));
      return newData;
    });
  };

  const handleSave = () => {
    onSave(formData);
    setHasChanges(false);
  };

  const handleReset = () => {
    setFormData({ ...DEFAULT_RULES });
    setHasChanges(true);
  };

  const forexMarkets = POPULAR_ASSETS.filter((a) => a.category === 'Forex');
  const cryptoMarkets = POPULAR_ASSETS.filter((a) => a.category === 'Crypto');

  return (
    <div className="bg-gray-800 rounded-2xl p-6 shadow-2xl border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Trading Rules</h2>
            <p className="text-xs text-gray-400">Configure bot parameters</p>
          </div>
        </div>
        {hasChanges && (
          <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-lg">
            Unsaved changes
          </span>
        )}
      </div>

      <div className="space-y-6">
        {/* Stake Settings */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Stake Settings
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Min Stake ($)</label>
              <input
                type="number"
                value={formData.minStake}
                onChange={(e) => handleChange('minStake', Number(e.target.value))}
                min={0.1}
                step={0.1}
                className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Max Stake ($)</label>
              <input
                type="number"
                value={formData.maxStake}
                onChange={(e) => handleChange('maxStake', Number(e.target.value))}
                min={1}
                className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Default ($)</label>
              <input
                type="number"
                value={formData.stakeAmount}
                onChange={(e) => handleChange('stakeAmount', Number(e.target.value))}
                min={0.1}
                step={0.1}
                className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700" />

        {/* Risk Management */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Risk Management
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Target Profit ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  value={formData.targetProfit}
                  onChange={(e) => handleChange('targetProfit', Number(e.target.value))}
                  min={0}
                  className="w-full pl-7 pr-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Stop Loss ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  value={formData.stopLoss}
                  onChange={(e) => handleChange('stopLoss', Number(e.target.value))}
                  min={0}
                  className="w-full pl-7 pr-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700" />

        {/* Trade Settings */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Trade Settings
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Max Concurrent</label>
              <input
                type="number"
                value={formData.maxConcurrentTrades}
                onChange={(e) => handleChange('maxConcurrentTrades', Number(e.target.value))}
                min={1}
                max={10}
                className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Trade Expiry</label>
              <select
                value={formData.tradingExpiry}
                onChange={(e) => handleChange('tradingExpiry', Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
              >
                {EXPIRY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700" />

        {/* Signal Settings */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Signal Settings
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-400">Min Signal Strength</label>
                <span className="text-sm font-medium text-blue-400">{formData.minSignalStrength}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={formData.minSignalStrength}
                onChange={(e) => handleChange('minSignalStrength', Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-400">Min Confidence</label>
                <span className="text-sm font-medium text-purple-400">{formData.minConfidence}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={formData.minConfidence}
                onChange={(e) => handleChange('minConfidence', Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700" />

        {/* Martingale Settings */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              Martingale
            </h3>
            <button
              onClick={() => handleChange('martingale', !formData.martingale)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                formData.martingale ? 'bg-green-500' : 'bg-gray-600'
              }`}
            >
              <motion.div
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                animate={{ left: formData.martingale ? 28 : 4 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
          {formData.martingale && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-2 gap-3"
            >
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Multiplier</label>
                <input
                  type="number"
                  value={formData.martingaleMultiplier}
                  onChange={(e) => handleChange('martingaleMultiplier', Number(e.target.value))}
                  min={1.1}
                  step={0.1}
                  className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Max Steps</label>
                <input
                  type="number"
                  value={formData.maxMartingaleSteps}
                  onChange={(e) => handleChange('maxMartingaleSteps', Number(e.target.value))}
                  min={1}
                  max={10}
                  className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </motion.div>
          )}
        </div>

        <div className="border-t border-gray-700" />

        {/* Trading Session */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Trading Session
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Start Time</label>
              <input
                type="time"
                value={formData.tradingSession.start}
                onChange={(e) => handleSessionChange('start', e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">End Time</label>
              <input
                type="time"
                value={formData.tradingSession.end}
                onChange={(e) => handleSessionChange('end', e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700" />

        {/* Allowed Markets */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Allowed Markets
            <span className="text-xs text-gray-500 font-normal">
              ({formData.allowedMarkets.length} selected)
            </span>
          </h3>

          {/* Forex Markets */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Forex</p>
            <div className="grid grid-cols-3 gap-2">
              {forexMarkets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => handleMarketToggle(asset.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    formData.allowedMarkets.includes(asset.id)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {asset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Crypto Markets */}
          <div>
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Crypto</p>
            <div className="grid grid-cols-3 gap-2">
              {cryptoMarkets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => handleMarketToggle(asset.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    formData.allowedMarkets.includes(asset.id)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {asset.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700" />

        {/* Action Buttons */}
        <div className="flex gap-3">
          <motion.button
            onClick={handleReset}
            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset to Defaults
          </motion.button>
          <motion.button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`flex-1 px-4 py-3 font-medium rounded-xl transition-all flex items-center justify-center gap-2 ${
              hasChanges
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
            whileHover={hasChanges ? { scale: 1.02 } : {}}
            whileTap={hasChanges ? { scale: 0.98 } : {}}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Save Rules
          </motion.button>
        </div>
      </div>
    </div>
  );
}
