import React, { useState } from 'react';
import { Search, Loader2, Globe, Sparkles } from 'lucide-react';

interface ScraperToolProps {
  onScrape: (url: string) => Promise<void>;
  isProcessing: boolean;
}

export const ScraperTool: React.FC<ScraperToolProps> = ({ onScrape, isProcessing }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    await onScrape(url);
    setUrl('');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full text-blue-600 mb-2">
            <Globe size={32} />
        </div>
        <h2 className="text-3xl font-bold text-slate-900">AI-Powered Web Analysis</h2>
        <p className="text-slate-500 max-w-lg mx-auto">
          Enter a URL below. Our AI agent will visit, scrape, and analyze the content structure, sentiment, and key entities for you.
        </p>
      </div>

      <div className="bg-white p-2 rounded-2xl shadow-lg border border-slate-100 transform transition-all focus-within:ring-4 focus-within:ring-blue-100 focus-within:border-blue-300">
        <form onSubmit={handleSubmit} className="flex items-center">
          <div className="pl-4 text-slate-400">
            <Search size={20} />
          </div>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/article"
            className="flex-1 p-4 bg-transparent border-none outline-none text-lg text-slate-900 placeholder:text-slate-300"
            required
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={isProcessing || !url.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-8 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Analyze
              </>
            )}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center text-sm text-slate-500 mt-12">
        <div className="p-4 bg-white rounded-lg border border-slate-100 shadow-sm">
            <span className="font-semibold text-slate-700 block mb-1">Smart Summaries</span>
            Get concise TL;DRs of complex pages.
        </div>
        <div className="p-4 bg-white rounded-lg border border-slate-100 shadow-sm">
            <span className="font-semibold text-slate-700 block mb-1">Sentiment Analysis</span>
            Understand the tone of the content.
        </div>
        <div className="p-4 bg-white rounded-lg border border-slate-100 shadow-sm">
            <span className="font-semibold text-slate-700 block mb-1">Entity Extraction</span>
            Identify people, places, and organizations.
        </div>
      </div>
    </div>
  );
};