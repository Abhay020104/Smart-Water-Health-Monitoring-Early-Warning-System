import { useState, useEffect } from 'react';
import { FiShield } from 'react-icons/fi';
import { getDiseasesInfo } from '../api';

const riskColors = {
  Critical: { bg: 'bg-red-500/15', border: 'border-red-500/30', badge: 'bg-red-500 text-white', text: 'text-red-400' },
  High: { bg: 'bg-orange-500/15', border: 'border-orange-500/30', badge: 'bg-orange-500 text-white', text: 'text-orange-400' },
  Moderate: { bg: 'bg-yellow-500/15', border: 'border-yellow-500/30', badge: 'bg-yellow-500 text-black', text: 'text-yellow-400' },
  None: { bg: 'bg-green-500/15', border: 'border-green-500/30', badge: 'bg-green-500 text-white', text: 'text-green-400' },
};

export default function Diseases() {
  const [diseases, setDiseases] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    getDiseasesInfo()
      .then((res) => { setDiseases(res.data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, []);

  if (loading) return <div className="text-center py-20 text-slate-400">Loading disease profiles...</div>;
  if (error) return <div className="glass-card p-6 text-red-400">⚠ {error}. Is the backend running?</div>;
  if (!diseases) return null;

  // Sort: Critical first, then High, Moderate, None
  const riskOrder = { Critical: 0, High: 1, Moderate: 2, None: 3 };
  const sorted = Object.entries(diseases).sort(
    (a, b) => (riskOrder[a[1].risk_level] ?? 4) - (riskOrder[b[1].risk_level] ?? 4)
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
          <FiShield className="text-purple-400" /> Waterborne Disease Reference
        </h2>
        <p className="text-sm text-slate-400">Comprehensive clinical profiles for all 8 tracked waterborne diseases</p>
      </div>

      {/* Risk Legend */}
      <div className="flex flex-wrap gap-3">
        {['Critical', 'High', 'Moderate', 'None'].map((r) => (
          <span key={r} className={`px-3 py-1 rounded-full text-xs font-bold ${riskColors[r].badge}`}>
            {r} Risk
          </span>
        ))}
      </div>

      {/* Disease Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {sorted.map(([name, info]) => {
          const rc = riskColors[info.risk_level] || riskColors.Moderate;
          const isExpanded = expanded === name;

          return (
            <div key={name}
              className={`glass-card p-6 border-l-4 cursor-pointer transition-all duration-300 ${rc.border} ${isExpanded ? 'md:col-span-2' : ''}`}
              onClick={() => setExpanded(isExpanded ? null : name)}>
              
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-white">{name.replace(/_/g, ' ')}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${rc.badge}`}>
                    {info.risk_level}
                  </span>
                </div>
              </div>
              
              <p className="text-xs text-slate-500 mb-2">{info.pathogen_type}</p>
              <p className="text-sm text-slate-300 mb-4">{info.description}</p>

              {/* Expandable Content */}
              <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                {info.common_symptoms?.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-slate-300 mb-2">Common Symptoms</h4>
                    <ul className="space-y-1">
                      {info.common_symptoms.map((s, i) => (
                        <li key={i} className={`text-sm flex items-start gap-2 ${rc.text}`}>
                          <span className="mt-0.5">•</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {info.prevention_measures?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-300 mb-2">Prevention Measures</h4>
                    <ul className="space-y-1">
                      {info.prevention_measures.map((m, i) => (
                        <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                          <span className="text-emerald-400 mt-0.5">✓</span> {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-500 mt-3">
                {isExpanded ? 'Click to collapse' : 'Click to expand details'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
