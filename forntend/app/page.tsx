'use client';

import { useState } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// Professional color palette
const colors = {
  primary: '#00d9ff',      // Vibrant cyan
  secondary: '#00ff88',    // Fresh green
  accent: '#8b5cf6',       // Purple accent
  danger: '#ef4444',       // Red for risks
  success: '#10b981',      // Green for safe
  dark: '#0f172a',         // Deep dark background
  darker: '#0a0e27',       // Darker background
  lightText: '#e0e7ff',    // Light text
  mutedText: '#94a3b8',    // Muted text
};

// Refined Spinner component
function Spinner() {
  return (
    <div className="inline-flex items-center justify-center">
      <div className="relative w-5 h-5">
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#00d9ff] border-r-[#00d9ff] animate-spin"></div>
      </div>
    </div>
  );
}

// Enhanced Score Card component
function ScoreCard({ 
  label, 
  value, 
  isPositive = true,
  subtext = ''
}: { 
  label: string; 
  value: string | number;
  isPositive?: boolean;
  subtext?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-slate-900/60 to-slate-800/40 backdrop-blur-xl border border-slate-700/50 hover:border-slate-600 transition-all duration-500 hover:shadow-2xl hover:shadow-slate-900/50">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-700/0 via-slate-700/0 to-slate-600/0 group-hover:from-slate-700/5 group-hover:via-slate-600/5 group-hover:to-slate-700/5 transition-all duration-500"></div>
      <div className="relative z-10">
        <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">{label}</p>
        <p className={`text-3xl font-bold font-mono mb-2 ${
          isPositive 
            ? 'text-green-400' 
            : 'text-red-400'
        }`}>
          {value}
        </p>
        {subtext && <p className="text-xs text-slate-500">{subtext}</p>}
      </div>
    </div>
  );
}

export default function Home() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('text');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageResult, setImageResult] = useState<any>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [videoResult, setVideoResult] = useState<any>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleAnalyzeText = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/analyze_text`, null, {
        params: { text },
      });
      setResult(response.data);
    } catch (error) {
      console.error('Error:', error);
      setResult({ error: 'Backend connection failed. Please try again.' });
    }
    setLoading(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement> | FileList) => {
    const files = 'target' in e ? (e.target as HTMLInputElement).files : e;
    if (!files || !files[0]) return;
    const file = files[0];
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAnalyzeImage = async () => {
    if (!imageFile) return;
    setImageLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      const response = await axios.post(`${BACKEND_URL}/analyze_image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImageResult(response.data);
    } catch (error) {
      console.error('Error:', error);
      setImageResult({ error: 'Analysis failed. Please try again.' });
    }
    setImageLoading(false);
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement> | FileList) => {
    const files = 'target' in e ? (e.target as HTMLInputElement).files : e;
    if (!files || !files[0]) return;
    const file = files[0];
    setVideoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setVideoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAnalyzeVideo = async () => {
    if (!videoFile) return;
    setVideoLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', videoFile);
      const response = await axios.post(`${BACKEND_URL}/analyze_video`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setVideoResult(response.data);
    } catch (error) {
      console.error('Error:', error);
      setVideoResult({ error: 'Analysis failed. Please try again.' });
    }
    setVideoLoading(false);
  };

  const DragDropArea = ({ onDrop, accept, children }: any) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDrag = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(e.type === 'dragenter' || e.type === 'dragover');
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files?.[0]) onDrop(e.dataTransfer.files);
    };

    return (
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 p-12 text-center cursor-pointer ${
          isDragging
            ? 'border-cyan-500/80 bg-cyan-500/10 shadow-lg shadow-cyan-500/30'
            : 'border-slate-600/80 bg-slate-800/30 hover:border-cyan-500/60 hover:bg-slate-800/50'
        }`}
      >
        <div className="relative z-10">{children}</div>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-x-hidden relative flex items-center justify-center">
      {/* Premium animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/20 rounded-full filter blur-3xl animate-pulse" style={{animationDuration: '4s'}}></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full filter blur-3xl animate-pulse" style={{animationDuration: '5s', animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-green-500/10 rounded-full filter blur-3xl animate-pulse" style={{animationDuration: '6s', animationDelay: '2s'}}></div>
      </div>

      {/* Main container - centered */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Header section - centered */}
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-7xl md:text-8xl font-black mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent drop-shadow-2xl">
              VERITAS
            </h1>
            <p className="text-sm md:text-base font-mono text-cyan-400 tracking-widest uppercase font-semibold letter-spacing">
              Truth Detection System
            </p>
          </div>
          <p className="text-slate-300 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            Enterprise-grade AI-powered detection of fake news and deepfake content
          </p>
        </div>

        {/* Main content card - perfectly centered */}
        <div className="relative w-full max-w-4xl mx-auto">
          {/* Premium glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/30 via-purple-500/30 to-cyan-500/30 rounded-3xl blur-2xl opacity-75 group-hover:opacity-100 transition duration-500"></div>
          
          {/* Card */}
          <div className="relative w-full bg-gradient-to-br from-slate-900/80 to-slate-950/80 backdrop-blur-2xl border border-slate-700/60 rounded-3xl p-10 md:p-14 shadow-2xl">
            {/* Subtle accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent rounded-t-3xl"></div>
            
            {/* Content */}
            <div className="relative z-10 space-y-8">
              {/* Professional tabs */}
              <div className="flex flex-wrap gap-3 pb-8 border-b border-slate-700/60">
                {[
                  { id: 'text', label: '📝 Text', icon: '📝' },
                  { id: 'image', label: '🖼️ Image', icon: '🖼️' },
                  { id: 'video', label: '🎬 Video', icon: '🎬' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setResult(null);
                      setImageResult(null);
                      setVideoResult(null);
                    }}
                    className={`relative px-6 py-3 text-sm font-semibold transition-all duration-300 rounded-xl ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-300 border border-cyan-500/50 shadow-lg shadow-cyan-500/20'
                        : 'text-slate-400 hover:text-slate-300 border border-slate-700/40 hover:border-slate-600/60'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Text Tab */}
              {activeTab === 'text' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-slate-200 uppercase tracking-wider">Analyze Text or Article</label>
                    <p className="text-xs text-slate-500">Paste news, articles, or any text content for fake news detection</p>
                  </div>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste your news article or text content here..."
                    className="w-full p-6 rounded-2xl bg-slate-800/50 border border-slate-700/60 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/30 transition-all duration-300 resize-none text-base font-mono leading-relaxed"
                    rows={9}
                  />
                  <button
                    onClick={handleAnalyzeText}
                    disabled={loading || !text.trim()}
                    className="w-full relative overflow-hidden rounded-xl px-8 py-4 font-bold text-white text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 group-hover:from-cyan-600 group-hover:to-blue-600 transition-all duration-300"></div>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-cyan-600 to-blue-600 blur transition-all duration-300"></div>
                    <div className="relative flex items-center justify-center gap-3">
                      {loading ? (
                        <>
                          <Spinner />
                          <span>Analyzing...</span>
                        </>
                      ) : (
                        <>
                          <span>⚡</span>
                          <span>Analyze Text</span>
                        </>
                      )}
                    </div>
                  </button>
                    {loading ? (
                      <>
                        <Spinner />
                        Analyzing...
                      </>
                    ) : (
                      '⚡ Analyze Now'
                    )}
                  </button>
                  {result && (
                    <div className="mt-10 pt-8 border-t border-slate-700/60 animate-fade-in">
                      <h3 className="text-lg font-semibold text-slate-200 mb-6">Analysis Results</h3>
                      {result.error ? (
                        <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-6 text-red-300">
                          <p className="font-semibold mb-2">⚠️ Error</p>
                          <p className="text-sm">{result.error}</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <ScoreCard 
                              label="Verdict" 
                              value={result.is_fake ? '🚨 FAKE' : '✅ AUTHENTIC'}
                              isPositive={!result.is_fake} />
                            <ScoreCard 
                              label="Confidence" 
                              value={`${(result.confidence * 100).toFixed(1)}%`} />
                            <ScoreCard 
                              label="Mode" 
                              value={result.mode === 'production' ? 'AI' : 'DEMO'} 
                              isPositive={result.mode === 'production'} />
                          </div>
                          <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-6">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Detailed Analysis</p>
                            <p className="text-slate-300 text-sm leading-relaxed">{result.explanation}</p>
                            {result.model && (
                              <p className="text-xs text-slate-500 mt-4">Model: {result.model}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Image Tab */}
              {activeTab === 'image' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-slate-200 uppercase tracking-wider">Upload Image</label>
                    <p className="text-xs text-slate-500">Analyze images for deepfake detection and authenticity</p>
                  </div>
                  <DragDropArea accept="image/*" onDrop={(files: FileList) => handleImageSelect(files)}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageSelect(e)}
                      className="hidden"
                      id="image-input"
                    />
                    <label htmlFor="image-input" className="cursor-pointer block">
                      <div className="text-6xl mb-4">🖼️</div>
                      <p className="text-base font-semibold text-cyan-400 mb-2">Drop image here or click to upload</p>
                      <p className="text-sm text-slate-500">PNG, JPG, WebP (max 10MB)</p>
                    </label>
                  </DragDropArea>
                  {imagePreview && (
                    <div className="space-y-4 animate-fade-in">
                      <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover rounded-2xl border border-slate-700/60 shadow-lg" />
                      <button
                        onClick={handleAnalyzeImage}
                        disabled={imageLoading}
                        className="w-full relative overflow-hidden rounded-xl px-8 py-4 font-bold text-white text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 group-hover:from-blue-600 group-hover:to-cyan-600 transition-all duration-300"></div>
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-blue-600 to-cyan-600 blur transition-all duration-300"></div>
                        <div className="relative flex items-center justify-center gap-3">
                          {imageLoading ? (
                            <>
                              <Spinner />
                              <span>Analyzing...</span>
                            </>
                          ) : (
                            <>
                              <span>⚡</span>
                              <span>Analyze Image</span>
                            </>
                          )}
                        </div>
                      </button>
                    </div>
                  )}
                  {imageResult && (
                    <div className="mt-10 pt-8 border-t border-slate-700/60 animate-fade-in">
                      <h3 className="text-lg font-semibold text-slate-200 mb-6">Analysis Results</h3>
                      {imageResult.error ? (
                        <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-6 text-red-300">
                          <p className="font-semibold mb-2">⚠️ Error</p>
                          <p className="text-sm">{imageResult.error}</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <ScoreCard
                              label="Verdict"
                              value={imageResult.label === 'FAKE' ? '🚨 DEEPFAKE' : '✅ AUTHENTIC'}
                              isPositive={imageResult.label !== 'FAKE'}
                            />
                            <ScoreCard label="Confidence" value={`${(imageResult.confidence * 100).toFixed(1)}%`} />
                            <ScoreCard label="Risk Level" value={imageResult.label === 'FAKE' ? 'HIGH' : 'LOW'} isPositive={imageResult.label !== 'FAKE'} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Video Tab */}
              {activeTab === 'video' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-slate-200 uppercase tracking-wider">Upload Video</label>
                    <p className="text-xs text-slate-500">Analyze videos for deepfake detection (processing may take 1-2 minutes)</p>
                  </div>
                  <DragDropArea accept="video/*" onDrop={(files: FileList) => handleVideoSelect(files)}>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleVideoSelect(e)}
                      className="hidden"
                      id="video-input"
                    />
                    <label htmlFor="video-input" className="cursor-pointer block">
                      <div className="text-6xl mb-4">🎬</div>
                      <p className="text-base font-semibold text-cyan-400 mb-2">Drop video here or click to upload</p>
                      <p className="text-sm text-slate-500">MP4, WebM (max 100MB)</p>
                    </label>
                  </DragDropArea>
                  {videoPreview && (
                    <div className="space-y-4 animate-fade-in">
                      <video
                        src={videoPreview}
                        controls
                        className="w-full h-64 object-cover rounded-2xl border border-slate-700/60 bg-slate-900 shadow-lg"
                      />
                      <button
                        onClick={handleAnalyzeVideo}
                        disabled={videoLoading}
                        className="w-full relative overflow-hidden rounded-xl px-8 py-4 font-bold text-white text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 group-hover:from-purple-600 group-hover:to-cyan-600 transition-all duration-300"></div>
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-purple-600 to-cyan-600 blur transition-all duration-300"></div>
                        <div className="relative flex items-center justify-center gap-3">
                          {videoLoading ? (
                            <>
                              <Spinner />
                              <span>Analyzing...</span>
                            </>
                          ) : (
                            <>
                              <span>⚡</span>
                              <span>Analyze Video</span>
                            </>
                          )}
                        </div>
                      </button>
                    </div>
                  )}
                  {videoResult && (
                    <div className="mt-10 pt-8 border-t border-slate-700/60 animate-fade-in">
                      <h3 className="text-lg font-semibold text-slate-200 mb-6">Analysis Results</h3>
                      {videoResult.error ? (
                        <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-6 text-red-300">
                          <p className="font-semibold mb-2">⚠️ Error</p>
                          <p className="text-sm">{videoResult.error}</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <ScoreCard
                              label="Verdict"
                              value={videoResult.label === 'FAKE' ? '🚨 DEEPFAKE' : '✅ AUTHENTIC'}
                              isPositive={videoResult.label !== 'FAKE'}
                            />
                            <ScoreCard label="Authenticity" value={`${(100 - (videoResult.fake_percentage || 0)).toFixed(1)}%`} />
                            <ScoreCard label="Frames Analyzed" value={videoResult.total_frames_analyzed || '0'} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Professional footer */}
        <div className="text-center mt-20 w-full max-w-4xl mx-auto">
          <p className="text-sm text-slate-500 font-mono tracking-wide">
            Powered by Advanced AI • 
            <span className="text-cyan-400 hover:text-cyan-300 transition-colors cursor-default"> Backend: {BACKEND_URL}</span>
          </p>
          <p className="text-xs text-slate-600 mt-4">
            © 2026 VERITAS Detection System. All rights reserved.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
        
        @keyframes glow-pulse {
          0%, 100% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
