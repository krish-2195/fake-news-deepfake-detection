'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Menu, X, LogOut, MessageSquare, History, Info, BarChart3, 
  CheckCircle, AlertCircle, Loader, Upload, Zap, TrendingUp,
  Eye, Lightbulb, Shield, Clock, FileText, Image as ImageIcon, Video
} from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://fake-news-deepfake-backend.onrender.com';

interface AnalysisResult {
  text?: string;
  is_fake: boolean;
  confidence: number;
  prediction: string;
  explanation?: string;
  mode: string;
  model?: string;
  error?: string;
}

interface HistoryItem {
  id: string;
  type: 'text' | 'image' | 'video';
  input: string;
  result: AnalysisResult;
  timestamp: Date;
}

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('text');
  const [activeNav, setActiveNav] = useState('analyze');
  
  // Input states
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  
  // Loading and result states
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [backendReady, setBackendReady] = useState<boolean | null>(null);
  
  const dragRef = useRef<HTMLDivElement>(null);

  // Check backend status on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/status`, { timeout: 5000 });
        setBackendReady(true);
      } catch (err) {
        setBackendReady(false);
      }
    };
    checkBackend();
  }, []);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('analysisHistory');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHistory(parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
      } catch (e) {
        console.error('Failed to load history:', e);
      }
    }
  }, []);

  // Save to history
  const saveToHistory = (type: 'text' | 'image' | 'video', input: string, analysisResult: AnalysisResult) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      type,
      input,
      result: analysisResult,
      timestamp: new Date()
    };
    const newHistory = [newItem, ...history].slice(0, 20);
    setHistory(newHistory);
    localStorage.setItem('analysisHistory', JSON.stringify(newHistory));
  };

  // Sample data for demonstration
  const sampleNews = [
    "Breaking news: Scientists discover new renewable energy source that could revolutionize power generation. Experts from MIT and Stanford collaborated on this groundbreaking research announced today.",
    "SHOCKING: Celebrity spotted at secret location - This will change EVERYTHING! Click here for details.",
    "Market report: Tech stocks showed mixed results this week with a 2.3% overall decline amid interest rate concerns."
  ];

  // Analyze text
  const handleAnalyzeText = async () => {
    if (!text.trim()) {
      setError('Please enter text to analyze');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${BACKEND_URL}/analyze_text`, null, {
        params: { text: text.substring(0, 500) },
        timeout: 30000,
      });
      setResult(response.data);
      saveToHistory('text', text.substring(0, 100), response.data);
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || err.message || 'Analysis failed';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Handle image upload
  const handleImageUpload = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Analyze image (demo)
  const handleAnalyzeImage = async () => {
    if (!imageFile) {
      setError('Please select an image');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      const response = await axios.post(`${BACKEND_URL}/analyze_image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      setResult(response.data);
      saveToHistory('image', imageFile.name, response.data);
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || err.message || 'Analysis failed';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      if (activeTab === 'image') {
        handleImageUpload(files[0]);
      }
    }
  };

  // Clear results
  const handleClear = () => {
    setText('');
    setImageFile(null);
    setImagePreview('');
    setVideoFile(null);
    setResult(null);
    setError(null);
  };

  // Sidebar navigation items
  const navItems = [
    { id: 'analyze', label: 'Analyze', icon: Zap },
    { id: 'history', label: 'History', icon: History },
    { id: 'about', label: 'About', icon: Info }
  ];

  // Chart data for results
  const confidenceData = result ? [
    { name: 'Confidence', value: Math.round(result.confidence * 100) }
  ] : [];

  const pieData = result ? [
    { name: 'Real', value: result.confidence * 100, color: '#10b981' },
    { name: 'Fake', value: (1 - result.confidence) * 100, color: '#ef4444' }
  ] : [];

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* SIDEBAR */}
      <div className={`fixed md:relative z-40 h-screen bg-gradient-to-b from-slate-950 to-slate-900 border-r border-slate-800/50 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0 md:w-20'}`}>
        
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-800/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-lg flex items-center justify-center font-bold text-sm">V</div>
              {sidebarOpen && <span className="font-bold text-lg tracking-wide">VERITAS AI</span>}
            </div>
            {sidebarOpen && <p className="text-xs text-slate-400">Truth Detection</p>}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    activeNav === item.id
                      ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 border border-cyan-500/50 text-cyan-300 shadow-lg shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Icon size={20} />
                  {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800/50 space-y-3">
            <div className="flex items-center justify-center h-10 rounded-lg bg-slate-800/50 text-xs text-slate-400 hover:bg-slate-700/50 cursor-pointer transition-colors">
              {sidebarOpen ? (
                <span className="text-center">Powered by <br /> Machine Learning</span>
              ) : (
                <Shield size={16} />
              )}
            </div>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-full py-2 text-slate-400 hover:text-white transition-colors">
              {sidebarOpen ? <X size={20} className="mx-auto" /> : <Menu size={20} className="mx-auto" />}
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER */}
        <header className="bg-gradient-to-r from-slate-900/80 to-slate-800/50 border-b border-slate-800/50 px-8 py-4 backdrop-blur-sm flex items-center justify-between sticky top-0 z-30">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">VERITAS AI</h1>
            <p className="text-xs text-slate-400 mt-1">Detecting Truth in the Digital Age</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/30 border border-slate-700/50">
              <div className={`w-2 h-2 rounded-full ${backendReady ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span className="text-xs text-slate-400">{backendReady ? 'Connected' : 'Offline'}</span>
            </div>
            <button className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors">
              <LogOut size={18} className="text-slate-400" />
            </button>
          </div>
        </header>

        {/* CONTENT AREA - SPLIT LAYOUT */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-8 h-full">
            {/* LEFT: INPUT PANEL */}
            <div className="flex flex-col gap-6 overflow-y-auto pr-2">
              {/* Input Card */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/30 to-indigo-500/30 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm hover:border-slate-600/50 transition-all duration-300">
                  
                  {/* Tabs */}
                  <div className="flex gap-2 mb-6 bg-slate-900/50 p-1 rounded-lg border border-slate-700/30">
                    {[
                      { id: 'text', label: 'Text', icon: FileText },
                      { id: 'image', label: 'Image', icon: ImageIcon },
                      { id: 'video', label: 'Video', icon: Video }
                    ].map(tab => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 font-medium text-sm ${
                            activeTab === tab.id
                              ? 'bg-gradient-to-r from-cyan-500/80 to-indigo-500/80 text-white shadow-lg'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Icon size={16} />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Input Area - by tab */}
                  {activeTab === 'text' && (
                    <div className="space-y-4">
                      <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Paste news article or content here... (e.g., 'A recent study shows that...')"
                        className="w-full h-48 bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => setText(sampleNews[Math.floor(Math.random() * sampleNews.length)])}
                          className="flex-1 px-4 py-2 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 transition-colors border border-slate-600/30 text-sm font-medium"
                        >
                          Try Sample
                        </button>
                        <button
                          onClick={handleClear}
                          className="px-4 py-2 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 transition-colors border border-slate-600/30 text-sm"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'image' && (
                    <div
                      ref={dragRef}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      className="space-y-4"
                    >
                      {imagePreview ? (
                        <div className="relative w-full h-48 rounded-lg overflow-hidden border border-slate-700/50">
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview('');
                            }}
                            className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-600 rounded-lg"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <label className="block p-8 rounded-lg border-2 border-dashed border-slate-700/50 hover:border-cyan-500/50 cursor-pointer transition-colors bg-slate-900/30 hover:bg-slate-900/50 text-center">
                          <Upload size={32} className="mx-auto mb-2 text-slate-400" />
                          <p className="text-sm text-slate-300 font-medium">Drop image or click to upload</p>
                          <p className="text-xs text-slate-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])}
                            className="hidden"
                          />
                        </label>
                      )}
                      <button
                        onClick={handleClear}
                        className="w-full px-4 py-2 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 transition-colors border border-slate-600/30 text-sm"
                      >
                        Clear
                      </button>
                    </div>
                  )}

                  {activeTab === 'video' && (
                    <div className="p-8 text-center text-slate-400">
                      <Video size={48} className="mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Video analysis coming soon</p>
                    </div>
                  )}

                  {error && (
                    <div className="mt-4 p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm flex gap-3 items-start">
                      <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                      <div>{error}</div>
                    </div>
                  )}

                  {/* Analyze Button */}
                  <button
                    onClick={activeTab === 'text' ? handleAnalyzeText : activeTab === 'image' ? handleAnalyzeImage : undefined}
                    disabled={loading || (activeTab === 'text' && !text.trim()) || (activeTab === 'image' && !imageFile)}
                    className="w-full mt-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 disabled:from-slate-700 disabled:to-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition-all duration-300 flex items-center justify-center gap-2 group shadow-lg hover:shadow-xl hover:shadow-cyan-500/20"
                  >
                    {loading ? (
                      <>
                        <Loader size={20} className="animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Zap size={20} />
                        Analyze Now
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-cyan-400">90%+</p>
                  <p className="text-xs text-slate-400 mt-1">Accuracy Rate</p>
                </div>
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-indigo-400">10K+</p>
                  <p className="text-xs text-slate-400 mt-1">Analyses Done</p>
                </div>
              </div>
            </div>

            {/* RIGHT: RESULT PANEL */}
            <div className="flex flex-col gap-6 overflow-y-auto pl-2">
              {result ? (
                <>
                  {/* Result Card */}
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/30 to-indigo-500/30 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500"></div>
                    <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
                      
                      {/* Badge */}
                      <div className="flex items-center justify-between mb-6">
                        <div className={`flex items-center gap-3 px-6 py-3 rounded-xl font-bold text-lg ${
                          result.is_fake
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-green-500/20 text-green-300 border border-green-500/30'
                        }`}>
                          {result.is_fake ? (
                            <>
                              <AlertCircle size={24} />
                              LIKELY FAKE
                            </>
                          ) : (
                            <>
                              <CheckCircle size={24} />
                              LIKELY REAL
                            </>
                          )}
                        </div>
                        <div className="text-sm text-slate-400">
                          <p className="font-semibold text-slate-300">Confidence</p>
                          <p className="text-xl font-bold text-cyan-400">{Math.round(result.confidence * 100)}%</p>
                        </div>
                      </div>

                      {/* Confidence Bar */}
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Confidence Score</p>
                        </div>
                        <div className="w-full h-2 bg-slate-900/50 rounded-full overflow-hidden border border-slate-700/30">
                          <div
                            className={`h-full transition-all duration-500 ${
                              result.is_fake
                                ? 'bg-gradient-to-r from-red-500 to-orange-500'
                                : 'bg-gradient-to-r from-green-500 to-teal-500'
                            }`}
                            style={{ width: `${result.confidence * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Explanation */}
                      <div className="space-y-3 mb-6">
                        <h3 className="font-semibold text-slate-300 flex items-center gap-2">
                          <Lightbulb size={16} className="text-cyan-400" />
                          Analysis Details
                        </h3>
                        <p className="text-sm text-slate-300 leading-relaxed">{result.explanation || 'No detailed analysis available.'}</p>
                      </div>

                      {/* Key Metrics */}
                      <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-700/30">
                        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/30">
                          <p className="text-xs text-slate-400">Model</p>
                          <p className="text-sm font-semibold text-slate-200 mt-1 truncate">{result.model || 'Advanced AI'}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/30">
                          <p className="text-xs text-slate-400">Mode</p>
                          <p className={`text-sm font-semibold mt-1 ${result.mode === 'production' ? 'text-green-400' : 'text-yellow-400'}`}>
                            {result.mode === 'production' ? 'Production' : 'Demo'}
                          </p>
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-3 mt-6 pt-6 border-t border-slate-700/30">
                        <button
                          onClick={handleClear}
                          className="flex-1 px-4 py-2 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 transition-colors text-sm font-medium"
                        >
                          New Analysis
                        </button>
                        <button className="flex-1 px-4 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 transition-colors text-sm font-medium border border-cyan-500/30">
                          Share Result
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Chart Card */}
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500"></div>
                    <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
                      <h3 className="font-semibold text-slate-300 mb-4">Verification Distribution</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any) => `${typeof value === 'number' ? value.toFixed(1) : value}%`} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex justify-center gap-6 mt-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span className="text-slate-300">Authentic</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <span className="text-slate-300">Fake</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="relative group h-full">
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500"></div>
                  <div className="relative bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-slate-700/30 rounded-2xl p-8 backdrop-blur-sm flex flex-col items-center justify-center h-full text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 rounded-full flex items-center justify-center mb-4 border border-slate-700/50">
                      <Eye size={32} className="text-cyan-400/50" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-300 mb-2">Ready to Analyze</h3>
                    <p className="text-sm text-slate-400 max-w-xs">
                      Paste content or upload files to the left to get started. Our AI will provide detailed analysis results here.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-30"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}
