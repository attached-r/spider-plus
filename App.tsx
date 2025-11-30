import React, { useState, useEffect } from 'react';
import { ViewState, ScrapeTask, ScrapeStatus } from './types';
import { analyzeUrlContent } from './services/geminiService';
import { Dashboard } from './components/Dashboard';
import { ScraperTool } from './components/ScraperTool';
import { TaskManager } from './components/TaskManager';
import { Layout, LayoutDashboard, Globe, List } from 'lucide-react';

// Demo data to pre-populate the app
const DEMO_TASKS: ScrapeTask[] = [
  {
    id: 'demo-1',
    url: 'https://en.wikipedia.org/wiki/Artificial_intelligence',
    createdAt: Date.now() - 10000000,
    status: ScrapeStatus.COMPLETED,
    result: {
      title: 'Artificial intelligence - Wikipedia',
      summary: 'Artificial intelligence (AI) is intelligence demonstrated by machines, as opposed to the natural intelligence displayed by humans and other animals. Example tasks in which this is done include speech recognition, computer vision, translation between (natural) languages, as well as other mappings of inputs.',
      keywords: ['Artificial Intelligence', 'Machine Learning', 'Computer Science', 'Neural Networks', 'Cognitive Computing'],
      sentiment: 'Neutral',
      mainEntities: ['Alan Turing', 'Dartmouth College', 'DeepMind', 'OpenAI', 'Google'],
      estimatedReadingTimeMinutes: 25,
      sources: [
        { title: 'Artificial intelligence - Wikipedia', uri: 'https://en.wikipedia.org/wiki/Artificial_intelligence' }
      ]
    }
  },
  {
    id: 'demo-2',
    url: 'https://www.nature.com/articles/d41586-023-03266-1',
    createdAt: Date.now() - 5000000,
    status: ScrapeStatus.COMPLETED,
    result: {
      title: 'Generative AI: The next frontier for science',
      summary: 'Generative artificial intelligence (AI) tools such as ChatGPT are rapidly transforming science. Researchers are using them to write code, summarize literature, and even generate new hypotheses. However, these tools also pose risks, such as hallucinating facts and perpetuating biases.',
      keywords: ['Generative AI', 'Science', 'Research', 'ChatGPT', 'Large Language Models'],
      sentiment: 'Positive',
      mainEntities: ['Nature', 'ChatGPT', 'GPT-4'],
      estimatedReadingTimeMinutes: 8,
      sources: [
        { title: 'Generative AI', uri: 'https://www.nature.com/articles/d41586-023-03266-1' }
      ]
    }
  }
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [tasks, setTasks] = useState<ScrapeTask[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load tasks from localStorage on mount, or use DEMO_TASKS
  useEffect(() => {
    const saved = localStorage.getItem('scrape_tasks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
           setTasks(parsed);
        } else {
           setTasks(DEMO_TASKS);
        }
      } catch (e) {
        console.error("Failed to parse tasks", e);
        setTasks(DEMO_TASKS);
      }
    } else {
      setTasks(DEMO_TASKS);
    }
  }, []);

  // Save tasks to localStorage when updated
  useEffect(() => {
    if (tasks.length > 0) {
       localStorage.setItem('scrape_tasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  const handleScrape = async (url: string) => {
    const newTask: ScrapeTask = {
      id: crypto.randomUUID(),
      url,
      createdAt: Date.now(),
      status: ScrapeStatus.PROCESSING,
    };

    setTasks(prev => [...prev, newTask]);
    setIsProcessing(true);
    setCurrentView('history'); // Switch to history to see progress/result immediately

    try {
      const result = await analyzeUrlContent(url);
      
      setTasks(prev => prev.map(t => 
        t.id === newTask.id 
          ? { ...t, status: ScrapeStatus.COMPLETED, result } 
          : t
      ));
    } catch (error: any) {
      console.error(error);
      setTasks(prev => prev.map(t => 
        t.id === newTask.id 
          ? { ...t, status: ScrapeStatus.FAILED, error: error.message || 'Unknown error occurred' } 
          : t
      ));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-20 lg:w-64 bg-slate-900 text-white fixed h-full z-10 flex flex-col transition-all duration-300">
        <div className="p-6 flex items-center justify-center lg:justify-start gap-3 border-b border-slate-800">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30">
            N
          </div>
          <span className="hidden lg:block font-bold text-lg tracking-tight">Nexus AI</span>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
              currentView === 'dashboard' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LayoutDashboard size={20} />
            <span className="hidden lg:block font-medium">Dashboard</span>
          </button>

          <button
            onClick={() => setCurrentView('scraper')}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
              currentView === 'scraper' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Globe size={20} />
            <span className="hidden lg:block font-medium">Scraper</span>
          </button>

          <button
            onClick={() => setCurrentView('history')}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
              currentView === 'history' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <List size={20} />
            <span className="hidden lg:block font-medium">History</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
           <div className="hidden lg:block text-xs text-slate-500 text-center">
              Powered by Google Gemini 2.5
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-20 lg:ml-64 p-6 lg:p-10 transition-all duration-300">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 capitalize">
              {currentView === 'dashboard' && 'Overview'}
              {currentView === 'scraper' && 'New Analysis'}
              {currentView === 'history' && 'Data Management'}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {currentView === 'dashboard' && 'View your scraping statistics and insights.'}
              {currentView === 'scraper' && 'Input a target URL to begin extraction.'}
              {currentView === 'history' && 'Manage and review your scraped content.'}
            </p>
          </div>
          <div className="bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm text-sm font-medium text-slate-600 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-amber-400 animate-pulse' : 'bg-green-500'}`} />
            {isProcessing ? 'Processing Task...' : 'System Ready'}
          </div>
        </header>

        <div className="max-w-6xl mx-auto">
          {currentView === 'dashboard' && <Dashboard tasks={tasks} />}
          {currentView === 'scraper' && <ScraperTool onScrape={handleScrape} isProcessing={isProcessing} />}
          {currentView === 'history' && <TaskManager tasks={tasks} onDelete={handleDelete} />}
        </div>
      </main>
    </div>
  );
};

export default App;