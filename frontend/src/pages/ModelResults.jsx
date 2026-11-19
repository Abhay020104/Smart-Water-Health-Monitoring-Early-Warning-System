import { useState, useEffect } from 'react';
import { FiAward, FiBarChart2 } from 'react-icons/fi';
import { getModelResults } from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const METRICS = ['accuracy', 'precision', 'recall', 'f1_score'];
const METRIC_LABELS = { accuracy: 'Accuracy', precision: 'Precision', recall: 'Recall', f1_score: 'F1-Score' };
const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#64748b'];

export default function ModelResults() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('water_quality_classification');

  useEffect(() => {
    getModelResults()
      .then((res) => { setData(res.data); setLoading(false); })
      .catch((err) => { setError(err.message || 'Failed to load'); setLoading(false); });
  }, []);

  if (loading) return <div className="text-center py-20 text-slate-400">Loading model results...</div>;
  if (error) return <div className="glass-card p-6 text-red-400">⚠ {error}. Is the backend running?</div>;
  if (!data) return null;

  const tasks = {
    water_quality_classification: { title: 'Water Quality Classification', data: data.water_quality_classification },
    disease_prediction: { title: 'Disease Prediction', data: data.disease_prediction },
  };

  const task = tasks[activeTab];
  const results = task?.data?.results || {};
  const bestModel = task?.data?.best_model || '';

  // Prepare chart data
  const barData = Object.entries(results).map(([model, metrics]) => ({
    name: model.length > 15 ? model.slice(0, 14) + '…' : model,
    fullName: model,
    Accuracy: parseFloat((metrics.accuracy * 100).toFixed(2)),
    Precision: parseFloat((metrics.precision * 100).toFixed(2)),
    Recall: parseFloat((metrics.recall * 100).toFixed(2)),
    'F1-Score': parseFloat((metrics.f1_score * 100).toFixed(2)),
  }));

  // Radar data for top 5 models by F1
  const top5 = Object.entries(results)
    .sort((a, b) => b[1].f1_score - a[1].f1_score)
    .slice(0, 5);

  const radarData = METRICS.map((metric) => {
    const point = { metric: METRIC_LABELS[metric] };
    top5.forEach(([model, metrics]) => {
      point[model] = parseFloat((metrics[metric] * 100).toFixed(2));
    });
    return point;
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
          <FiBarChart2 className="text-cyan-400" /> ML Model Performance Comparison
        </h2>
        <p className="text-sm text-slate-400">10 classification models evaluated on {data.sample_size?.toLocaleString() || '200,000'} samples</p>
      </div>

      {/* Task Tabs */}
      <div className="flex gap-2">
        {Object.entries(tasks).map(([key, t]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === key
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:text-slate-300'
            }`}>
            {t.title}
          </button>
        ))}
      </div>

      {/* Best Model Banner */}
      <div className="glass-card p-4 flex items-center gap-3 border border-emerald-500/30">
        <FiAward className="text-2xl text-emerald-400" />
        <div>
          <span className="text-sm text-slate-400">Best Model: </span>
          <span className="font-bold text-emerald-400">{bestModel}</span>
          {results[bestModel] && (
            <span className="text-sm text-slate-400 ml-2">
              (F1: {(results[bestModel].f1_score * 100).toFixed(2)}%, Acc: {(results[bestModel].accuracy * 100).toFixed(2)}%)
            </span>
          )}
        </div>
      </div>

      {/* Metrics Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Model</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium">Accuracy</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium">Precision</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium">Recall</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium">F1-Score</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(results)
                .sort((a, b) => b[1].f1_score - a[1].f1_score)
                .map(([model, metrics], idx) => (
                  <tr key={model} className={`border-b border-slate-800 ${model === bestModel ? 'bg-emerald-500/10' : 'hover:bg-slate-800/50'}`}>
                    <td className="px-4 py-3 font-medium text-white flex items-center gap-2">
                      {idx === 0 && <span className="text-emerald-400">🏆</span>}
                      {model}
                    </td>
                    {METRICS.map((m) => (
                      <td key={m} className="text-right px-4 py-3 text-slate-300 font-mono">
                        {(metrics[m] * 100).toFixed(2)}%
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-4">Accuracy & F1-Score Comparison</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={barData} margin={{ top: 5, right: 10, left: 10, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" angle={-35} textAnchor="end" tick={{ fill: '#94a3b8', fontSize: 11 }} interval={0} />
              <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '0.5rem', color: '#e2e8f0' }}
                formatter={(v) => `${v}%`}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Bar dataKey="Accuracy" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              <Bar dataKey="F1-Score" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar Chart */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-4">Top 5 Models — Multi-Metric Radar</h3>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
              {top5.map(([model], i) => (
                <Radar key={model} name={model} dataKey={model} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.1} />
              ))}
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '0.5rem', color: '#e2e8f0' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Features Info */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-white mb-3">Feature Sets Used</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-semibold text-cyan-400 mb-2">Water Quality Features ({data.wq_features?.length || 12})</h4>
            <div className="flex flex-wrap gap-1.5">
              {(data.wq_features || []).map((f) => (
                <span key={f} className="text-xs bg-slate-700/50 text-slate-300 px-2 py-1 rounded">{f}</span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-purple-400 mb-2">Disease Features ({data.disease_features?.length || 26})</h4>
            <div className="flex flex-wrap gap-1.5">
              {(data.disease_features || []).map((f) => (
                <span key={f} className="text-xs bg-slate-700/50 text-slate-300 px-2 py-1 rounded">{f}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
