'use client';

import { useState } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// Spinner component
function Spinner() {
  return (
    <div className="inline-flex items-center justify-center">
      <div className="relative w-6 h-6">
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 border-r-cyan-400 animate-spin"></div>
      </div>
    </div>
  );
}

// Score card component
function ScoreCard({ 
  label, 
  value, 
  isPositive = true 
}: { 
  label: string; 
  value: string | number; 
  isPositive?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-400/20">
      <div className="relative z-10">
        <p className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">{label}</p>
        <p className={`text-2xl font-bold font-mono ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {value}
        </p>
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
        className={`relative rounded-xl border-2 border-dashed transition-all duration-300 p-8 text-center cursor-pointer ${
          isDragging
            ? 'border-cyan-400 bg-cyan-400/10 shadow-lg shadow-cyan-400/30'
            : 'border-cyan-400/30 bg-white/5 hover:border-cyan-400/60'
        }`}
      >
        <div className="relative z-10">{children}</div>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-x-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-16 w-full">
          <div className="inline-block mb-6">
            <div className="text-6xl md:text-7xl font-black mb-3 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-lg">
              VERITAS
            </div>
            <div className="text-xs md:text-sm font-mono text-cyan-400 tracking-widest">Truth Detection System</div>
          </div>
          <p className="text-gray-400 max-w-3xl mx-auto text-sm md:text-base leading-relaxed">
            AI-powered detection of fake news and deepfake content
          </p>
        </div>

        {/* Main card */}
        <div className="relative w-full">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-3xl blur-2xl"></div>
          <div className="relative w-full bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-3xl border border-white/20 rounded-3xl p-8 md:p-12 shadow-2xl">
            <div className="relative z-10">
              {/* Tabs */}
              <div className="flex gap-2 md:gap-6 mb-10 border-b border-white/10 pb-6 overflow-x-auto w-full">
                {[
                  { id: 'text', label: '📝 Text Analysis' },
                  { id: 'image', label: '🖼️ Image Analysis' },
                  { id: 'video', label: '🎬 Video Analysis' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setResult(null);
                      setImageResult(null);
                      setVideoResult(null);
                    }}
                    className={`px-6 py-3 text-sm md:text-base font-semibold whitespace-nowrap transition-all duration-300 rounded-lg ${
                      activeTab === tab.id
                        ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-400/10 shadow-lg shadow-cyan-400/20'
                        : 'text-gray-400 hover:text-gray-300 border-b-2 border-transparent hover:border-cyan-400/30'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Text Tab */}
              {activeTab === 'text' && (
                <div className="space-y-6 w-full">
                  <label className="block text-sm font-semibold text-cyan-400 mb-4 uppercase tracking-widest">Analyze News or Article</label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste your news article, social media post, or any text here..."
                    className="w-full p-6 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/30 transition-all duration-300 resize-none text-base"
                    rows={8}
                  />
                  <button
                    onClick={handleAnalyzeText}
                    disabled={loading || !text.trim()}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-cyan-500/40 hover:shadow-cyan-600/50 text-lg"
                  >
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
                    <div className="mt-8">
                      {result.error ? (
                        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400">{result.error}</div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <ScoreCard label="Verdict" value={result.is_fake ? '🚨 FAKE' : '✅ REAL'} isPositive={!result.is_fake} />
                            <ScoreCard label="Confidence" value={`${(result.confidence * 100).toFixed(1)}%`} />
                            <ScoreCard label="Mode" value={result.mode === 'production' ? 'AI' : 'DEMO'} />
                          </div>
                          <div className="bg-white/5 border border-white/20 rounded-lg p-4">
                            <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Analysis:</p>
                            <p className="text-gray-300 text-sm leading-relaxed">{result.explanation}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Image Tab */}
              {activeTab === 'image' && (
                <div className="space-y-6 w-full">
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
                      <p className="text-sm text-gray-500">PNG, JPG, WebP up to 10MB</p>
                    </label>
                  </DragDropArea>
                  {imagePreview && (
                    <div className="space-y-4">
                      <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover rounded-lg border border-white/20" />
                      <button
                        onClick={handleAnalyzeImage}
                        disabled={imageLoading}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-cyan-500/40 text-lg"
                      >
                        {imageLoading ? (
                          <>
                            <Spinner />
                            Analyzing Image...
                          </>
                        ) : (
                          '⚡ Analyze Image'
                        )}
                      </button>
                    </div>
                  )}
                  {imageResult && (
                    <div className="mt-8">
                      {imageResult.error ? (
                        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400">{imageResult.error}</div>
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
                <div className="space-y-6 w-full">
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
                      <p className="text-sm text-gray-500">MP4, WebM up to 100MB (may take 1-2 minutes)</p>
                    </label>
                  </DragDropArea>
                  {videoPreview && (
                    <div className="space-y-4">
                      <video
                        src={videoPreview}
                        controls
                        className="w-full h-64 object-cover rounded-lg border border-white/20 bg-black"
                      />
                      <button
                        onClick={handleAnalyzeVideo}
                        disabled={videoLoading}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-cyan-500/40 text-lg"
                      >
                        {videoLoading ? (
                          <>
                            <Spinner />
                            Analyzing Video...
                          </>
                        ) : (
                          '⚡ Analyze Video'
                        )}
                      </button>
                    </div>
                  )}
                  {videoResult && (
                    <div className="mt-8">
                      {videoResult.error ? (
                        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400">{videoResult.error}</div>
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

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500 text-xs w-full">
          <p className="font-mono">
            Powered by AI • Backend: <span className="text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer">{BACKEND_URL}</span>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
      `}</style>
    </div>
  );
}
