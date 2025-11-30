import React, { useState } from 'react';
import { ScrapeTask, ScrapeStatus } from '../types';
import { Trash2, ExternalLink, CheckCircle, XCircle, Clock, ChevronRight, FileText, Tag, User, Globe, Download, FolderDown, HardDrive, Save } from 'lucide-react';

interface TaskManagerProps {
  tasks: ScrapeTask[];
  onDelete: (id: string) => void;
}

export const TaskManager: React.FC<TaskManagerProps> = ({ tasks, onDelete }) => {
  const [selectedTask, setSelectedTask] = useState<ScrapeTask | null>(null);
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Helper to download data as a JSON file (Fallback)
  const downloadData = (data: any, filename: string) => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getSafeFilename = (title: string, id: string) => {
    const safeTitle = (title || 'untitled')
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase()
      .substring(0, 40);
    return `${safeTitle}_${id.substring(0, 6)}.json`;
  };

  // Connect to local directory
  const handleConnectFolder = async () => {
    try {
      // @ts-ignore - File System Access API types might not be fully available in all envs
      const handle = await window.showDirectoryPicker();
      setDirHandle(handle);
      setSaveStatus(`Connected to: ${handle.name}`);
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error("Error accessing folder:", err);
      // User likely cancelled or API not supported
    }
  };

  const saveToLocalFolder = async (task: ScrapeTask) => {
    if (!task.result) return;
    const filename = getSafeFilename(task.result.title, task.id);
    const fileContent = JSON.stringify(task.result, null, 2);

    try {
      if (dirHandle) {
        // Create/Get 'scraped_data' sub-folder
        // @ts-ignore
        const dataDir = await dirHandle.getDirectoryHandle('scraped_data', { create: true });
        
        // Create file
        // @ts-ignore
        const fileHandle = await dataDir.getFileHandle(filename, { create: true });
        // @ts-ignore
        const writable = await fileHandle.createWritable();
        await writable.write(fileContent);
        await writable.close();
        
        setSaveStatus(`Saved ${filename} to disk!`);
      } else {
        // Fallback to download
        downloadData(task.result, filename);
        setSaveStatus(`Downloaded ${filename}`);
      }
    } catch (err) {
      console.error("Save failed:", err);
      setSaveStatus("Failed to save file. check permissions.");
    }

    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleExportAll = async () => {
    if (dirHandle) {
        let count = 0;
        for (const task of tasks) {
            if (task.status === ScrapeStatus.COMPLETED) {
                await saveToLocalFolder(task);
                count++;
            }
        }
        setSaveStatus(`Batch saved ${count} files to folder!`);
        setTimeout(() => setSaveStatus(null), 3000);
    } else {
        const dateStr = new Date().toISOString().split('T')[0];
        downloadData(tasks, `nexus_scrapes_backup_${dateStr}.json`);
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl border border-slate-100 border-dashed">
        <FileText size={48} className="mx-auto text-slate-300 mb-4" />
        <h3 className="text-lg font-medium text-slate-900">No scraping tasks found</h3>
        <p className="text-slate-500">Head over to the Scraper tool to start your first analysis.</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 animate-in fade-in duration-500">
      {/* List Column */}
      <div className={`flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden ${selectedTask ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-3">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-slate-700">Analysis History</h3>
                <button 
                    onClick={handleExportAll}
                    title={dirHandle ? "Save all to folder" : "Download all as JSON"}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors flex items-center gap-2 text-xs font-medium"
                >
                    {dirHandle ? <Save size={16} /> : <FolderDown size={16} />}
                    {dirHandle ? 'Save All' : 'Export All'}
                </button>
            </div>
            
            {/* File System Connection Bar */}
            <div className={`text-xs px-3 py-2 rounded-lg border flex justify-between items-center transition-colors
                ${dirHandle ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                <div className="flex items-center gap-2 truncate">
                    <HardDrive size={14} />
                    <span className="truncate max-w-[150px]">
                        {dirHandle ? `Saved to: /${dirHandle.name}/scraped_data/` : 'Local storage disconnected'}
                    </span>
                </div>
                <button 
                    onClick={handleConnectFolder}
                    className="whitespace-nowrap font-semibold hover:underline ml-2"
                >
                    {dirHandle ? 'Change' : 'Connect Folder'}
                </button>
            </div>
            {saveStatus && (
                <div className="text-xs text-center text-blue-600 font-medium animate-pulse">
                    {saveStatus}
                </div>
            )}
        </div>

        <div className="overflow-y-auto flex-1">
          {tasks.slice().reverse().map((task) => (
            <div
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className={`p-4 border-b border-slate-100 cursor-pointer transition-colors hover:bg-slate-50 ${selectedTask?.id === task.id ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-slate-900 truncate max-w-[200px] sm:max-w-xs">
                  {task.result?.title || task.url}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                  className="text-slate-400 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                {task.status === ScrapeStatus.COMPLETED && <CheckCircle size={14} className="text-green-500" />}
                {task.status === ScrapeStatus.FAILED && <XCircle size={14} className="text-red-500" />}
                {task.status === ScrapeStatus.PENDING && <Clock size={14} className="text-amber-500" />}
                <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                <span className="mx-1">•</span>
                <span className="truncate max-w-[150px]">{new URL(task.url).hostname}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Details Column */}
      <div className={`flex-[1.5] bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col ${!selectedTask ? 'hidden md:flex items-center justify-center text-slate-400' : 'flex'}`}>
        {selectedTask ? (
          <>
            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/30">
              <div className="flex-1 pr-4">
                <button 
                  onClick={() => setSelectedTask(null)}
                  className="md:hidden text-blue-600 text-sm mb-2 flex items-center"
                >
                    &larr; Back to list
                </button>
                <h2 className="text-xl font-bold text-slate-900 leading-tight mb-2">
                  {selectedTask.result?.title || 'Processing...'}
                </h2>
                <a 
                  href={selectedTask.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  {selectedTask.url} <ExternalLink size={12} />
                </a>
              </div>
              
              <div className="flex flex-col items-end gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold
                  ${selectedTask.status === ScrapeStatus.COMPLETED ? 'bg-green-100 text-green-700' : ''}
                  ${selectedTask.status === ScrapeStatus.FAILED ? 'bg-red-100 text-red-700' : ''}
                  ${selectedTask.status === ScrapeStatus.PROCESSING ? 'bg-blue-100 text-blue-700' : ''}
                `}>
                  {selectedTask.status}
                </span>
                
                {selectedTask.result && (
                  <button
                    onClick={() => saveToLocalFolder(selectedTask)}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 border border-slate-200 hover:border-blue-200 px-3 py-1.5 rounded-lg transition-all bg-white shadow-sm"
                    title={dirHandle ? "Save to selected folder" : "Download file"}
                  >
                    {dirHandle ? <HardDrive size={14} /> : <Download size={14} />}
                    {dirHandle ? 'Save to Disk' : 'Download JSON'}
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {selectedTask.error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">
                  Error: {selectedTask.error}
                </div>
              )}

              {selectedTask.result && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-slate-50 rounded-lg">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Sentiment</span>
                        <span className={`font-medium 
                            ${selectedTask.result.sentiment === 'Positive' ? 'text-green-600' : ''}
                            ${selectedTask.result.sentiment === 'Negative' ? 'text-red-600' : ''}
                            ${selectedTask.result.sentiment === 'Neutral' ? 'text-slate-600' : ''}
                        `}>{selectedTask.result.sentiment}</span>
                     </div>
                     <div className="p-4 bg-slate-50 rounded-lg">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Reading Time</span>
                        <span className="font-medium text-slate-700">{selectedTask.result.estimatedReadingTimeMinutes} mins</span>
                     </div>
                  </div>

                  <div>
                    <h4 className="flex items-center gap-2 font-semibold text-slate-800 mb-2">
                      <FileText size={18} className="text-slate-400" /> Summary
                    </h4>
                    <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg">
                      {selectedTask.result.summary}
                    </p>
                  </div>

                  <div>
                    <h4 className="flex items-center gap-2 font-semibold text-slate-800 mb-2">
                      <Tag size={18} className="text-slate-400" /> Keywords
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTask.result.keywords.map((kw, i) => (
                        <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="flex items-center gap-2 font-semibold text-slate-800 mb-2">
                      <User size={18} className="text-slate-400" /> Main Entities
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTask.result.mainEntities.map((entity, i) => (
                        <span key={i} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm border border-purple-100">
                          {entity}
                        </span>
                      ))}
                    </div>
                  </div>

                  {selectedTask.result.sources && selectedTask.result.sources.length > 0 && (
                    <div>
                      <h4 className="flex items-center gap-2 font-semibold text-slate-800 mb-2">
                        <Globe size={18} className="text-slate-400" /> Sources & Citations
                      </h4>
                      <div className="bg-slate-50 rounded-lg border border-slate-100 divide-y divide-slate-100">
                        {selectedTask.result.sources.map((source, i) => (
                          <a 
                            key={i} 
                            href={source.uri}
                            target="_blank"
                            rel="noreferrer" 
                            className="block p-3 text-sm text-blue-600 hover:bg-slate-100 hover:underline truncate transition-colors"
                          >
                            <span className="font-medium text-slate-700 block text-xs mb-0.5">{source.title || 'Unknown Source'}</span>
                            {source.uri}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center">
            <ChevronRight size={48} className="text-slate-200 mb-4" />
            <p className="text-slate-500 font-medium">Select a task to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};