import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ScrapeTask, ScrapeStatus } from '../types';
import { Activity, Database, Clock, AlertCircle } from 'lucide-react';

interface DashboardProps {
  tasks: ScrapeTask[];
}

const COLORS = ['#0ea5e9', '#22c55e', '#ef4444'];

export const Dashboard: React.FC<DashboardProps> = ({ tasks }) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === ScrapeStatus.COMPLETED).length;
  const failedTasks = tasks.filter(t => t.status === ScrapeStatus.FAILED).length;
  const avgProcessingTime = 1.2; // Mock metric for demo purposes

  // Prepare data for sentiment chart
  const sentimentCounts = tasks.reduce((acc, task) => {
    if (task.result?.sentiment) {
      acc[task.result.sentiment] = (acc[task.result.sentiment] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const pieData = [
    { name: 'Positive', value: sentimentCounts['Positive'] || 0 },
    { name: 'Neutral', value: sentimentCounts['Neutral'] || 0 },
    { name: 'Negative', value: sentimentCounts['Negative'] || 0 },
  ].filter(d => d.value > 0);

  // Prepare data for activity chart (mocking last 7 days distribution based on timestamps)
  // In a real app, we would group `tasks` by `createdAt` date.
  const barData = [
    { name: 'Mon', tasks: 2 },
    { name: 'Tue', tasks: 4 },
    { name: 'Wed', tasks: 1 },
    { name: 'Thu', tasks: 5 },
    { name: 'Fri', tasks: 3 },
    { name: 'Sat', tasks: totalTasks > 15 ? 6 : 2 },
    { name: 'Sun', tasks: totalTasks > 20 ? 4 : 1 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Database size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Scrapes</p>
            <h3 className="text-2xl font-bold text-slate-900">{totalTasks}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Success Rate</p>
            <h3 className="text-2xl font-bold text-slate-900">
              {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
            </h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Avg. Time</p>
            <h3 className="text-2xl font-bold text-slate-900">{avgProcessingTime}s</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Failed</p>
            <h3 className="text-2xl font-bold text-slate-900">{failedTasks}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Weekly Activity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{fill: '#f1f5f9'}}
                />
                <Bar dataKey="tasks" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Content Sentiment</h3>
          <div className="h-64 flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-sm">No sentiment data available yet.</div>
            )}
          </div>
          {pieData.length > 0 && (
             <div className="flex justify-center gap-4 mt-2">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center text-sm text-slate-600">
                    <span className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: COLORS[index % COLORS.length]}}></span>
                    {entry.name}
                  </div>
                ))}
             </div>
          )}
        </div>
      </div>
    </div>
  );
};