// Mark this as a Client Component to use React hooks (useState, onClick, etc.)
// In Next.js 13+, components are Server Components by default
'use client';

// Import React hooks for state management
import { useState } from 'react';
// Import axios for making HTTP requests to the backend API
import axios from 'axios';

// Get backend URL from environment variable
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// Main component - the home page of the app
export default function Home() {
  // State to store the text the user enters in the textarea
  const [text, setText] = useState('');

  // State to store the backend response (contains is_fake, confidence, explanation)
  const [result, setResult] = useState<any>(null);

  // State to show "Analyzing..." while waiting for backend response
  const [loading, setLoading] = useState(false);

  // State for tab switching
  const [activeTab, setActiveTab] = useState('text');

  // State for image analysis
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageResult, setImageResult] = useState<any>(null);
  const [imageLoading, setImageLoading] = useState(false);

  // State for video analysis
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [videoResult, setVideoResult] = useState<any>(null);
  const [videoLoading, setVideoLoading] = useState(false);

  // Function to send text to backend and get prediction
  const handleAnalyzeText = async () => {
    // Don't send empty text
    if (!text.trim()) return;

    // Show loading state
    setLoading(true);

    try {
      // Send POST request to FastAPI backend at BACKEND_URL/analyze_text
      // The ?text=... is passed as a query parameter
      const response = await axios.post(
        `${BACKEND_URL}/analyze_text`,
        null,
        { params: { text } }
      );

      // Save the response data (is_fake, confidence, explanation)
      setResult(response.data);
    } catch (error) {
      // If the backend is not running, show an alert
      console.error('Error:', error);
      alert('Backend connection failed. Make sure the backend is running.');
    }

    // Stop showing loading state
    setLoading(false);
  };

  // Handle image file selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Analyze image function
  const handleAnalyzeImage = async () => {
    if (!imageFile) return;
    setImageLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', imageFile);

      const response = await axios.post(
        `${BACKEND_URL}/analyze_image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setImageResult(response.data);
    } catch (error) {
      console.error('Error:', error);
      alert('Backend error. Check console for details.');
    }

    setImageLoading(false);
  };

  // Handle video file selection
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Analyze video function
  const handleAnalyzeVideo = async () => {
    if (!videoFile) return;
    setVideoLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', videoFile);

      const response = await axios.post(
        `${BACKEND_URL}/analyze_video`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setVideoResult(response.data);
    } catch (error) {
      console.error('Error:', error);
      alert('Backend error. Check console for details.');
    }

    setVideoLoading(false);
  };

  // Render the UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-2xl p-8">
        <h1 className="text-4xl font-bold mb-2 text-center text-gray-800">
          🔍 Fake News & Deepfake Detector
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Analyze text, images, or videos to detect fakes
        </p>

        {/* TAB BUTTONS */}
        <div className="flex gap-4 mb-8 border-b-2 border-gray-200">
          <button
            onClick={() => setActiveTab('text')}
            className={`px-6 py-3 font-bold transition-all ${
              activeTab === 'text'
                ? 'text-blue-600 border-b-4 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📝 Text Analysis
          </button>
          <button
            onClick={() => setActiveTab('image')}
            className={`px-6 py-3 font-bold transition-all ${
              activeTab === 'image'
                ? 'text-blue-600 border-b-4 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🖼️ Image Analysis
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`px-6 py-3 font-bold transition-all ${
              activeTab === 'video'
                ? 'text-blue-600 border-b-4 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🎬 Video Analysis
          </button>
        </div>

        {/* TEXT TAB */}
        {activeTab === 'text' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Enter text to analyze:
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter news article, social media post, or any text..."
                className="w-full p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={8}
              />
            </div>

            <button
              onClick={handleAnalyzeText}
              disabled={loading || !text.trim()}
              className="w-full bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 font-bold text-lg"
            >
              {loading ? '⏳ Analyzing...' : '📊 Analyze Text'}
            </button>

            {result && (
              <div className="mt-6 p-6 bg-gray-50 rounded-lg border-2 border-gray-200">
                <h2 className="text-2xl font-bold mb-4">📋 Result:</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-700 font-semibold">Status:</p>
                    <p
                      className={`text-2xl font-bold ${
                        result.is_fake ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {result.is_fake ? '⚠️ Likely Fake' : '✅ Likely Real'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-700 font-semibold">Confidence:</p>
                    <div className="flex items-center gap-4">
                      <div className="w-full bg-gray-300 rounded-full h-4">
                        <div
                          className={`h-4 rounded-full ${
                            result.is_fake ? 'bg-red-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${result.confidence * 100}%` }}
                        />
                      </div>
                      <span className="font-bold">
                        {(result.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-700 font-semibold">Explanation:</p>
                    <p className="text-gray-600 italic">{result.explanation}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* IMAGE TAB */}
        {activeTab === 'image' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Upload an image to analyze:
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer"
              />
            </div>

            {imagePreview && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-2">Preview:</p>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-64 object-contain rounded-lg border-2 border-gray-300"
                  />
                </div>

                <button
                  onClick={handleAnalyzeImage}
                  disabled={imageLoading}
                  className="w-full bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 font-bold text-lg"
                >
                  {imageLoading ? '⏳ Analyzing Image...' : '📊 Analyze Image'}
                </button>
              </div>
            )}

            {imageResult && (
              <div className="mt-6 p-6 bg-gray-50 rounded-lg border-2 border-gray-200">
                <h2 className="text-2xl font-bold mb-4">📋 Result:</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-700 font-semibold">Status:</p>
                    <p
                      className={`text-2xl font-bold ${
                        imageResult.label === 'FAKE'
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}
                    >
                      {imageResult.label === 'FAKE'
                        ? '⚠️ Deepfake Detected'
                        : '✅ Genuine Image'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-700 font-semibold">Confidence:</p>
                    <div className="flex items-center gap-4">
                      <div className="w-full bg-gray-300 rounded-full h-4">
                        <div
                          className={`h-4 rounded-full ${
                            imageResult.label === 'FAKE'
                              ? 'bg-red-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${imageResult.confidence * 100}%` }}
                        />
                      </div>
                      <span className="font-bold">
                        {(imageResult.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIDEO TAB */}
        {activeTab === 'video' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Upload a video to analyze:
              </label>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoSelect}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer"
              />
            </div>

            {videoPreview && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-2">Preview:</p>
                  <video
                    src={videoPreview}
                    controls
                    className="w-full rounded-lg border-2 border-gray-300"
                  />
                </div>

                <button
                  onClick={handleAnalyzeVideo}
                  disabled={videoLoading}
                  className="w-full bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 font-bold text-lg"
                >
                  {videoLoading
                    ? '⏳ Analyzing Video (This may take a minute)...'
                    : '📊 Analyze Video'}
                </button>
              </div>
            )}

            {videoResult && (
              <div className="mt-6 p-6 bg-gray-50 rounded-lg border-2 border-gray-200">
                <h2 className="text-2xl font-bold mb-4">📋 Result:</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-700 font-semibold">Status:</p>
                    <p
                      className={`text-2xl font-bold ${
                        videoResult.label === 'FAKE'
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}
                    >
                      {videoResult.label === 'FAKE'
                        ? '⚠️ Deepfake Detected'
                        : '✅ Genuine Video'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-700 font-semibold">Confidence:</p>
                    <div className="flex items-center gap-4">
                      <div className="w-full bg-gray-300 rounded-full h-4">
                        <div
                          className={`h-4 rounded-full ${
                            videoResult.label === 'FAKE'
                              ? 'bg-red-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${videoResult.confidence * 100}%` }}
                        />
                      </div>
                      <span className="font-bold">
                        {(videoResult.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-700 font-semibold">Frames Analyzed:</p>
                      <p className="text-lg font-bold text-blue-600">
                        {videoResult.total_frames_analyzed}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-700 font-semibold">Fake Frames:</p>
                      <p className="text-lg font-bold text-red-600">
                        {videoResult.fake_frames}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-700 font-semibold">Real Frames:</p>
                      <p className="text-lg font-bold text-green-600">
                        {videoResult.real_frames}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-700 font-semibold">Fake %:</p>
                      <p className="text-lg font-bold text-orange-600">
                        {videoResult.fake_percentage?.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
