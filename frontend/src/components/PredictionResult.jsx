import { FiAlertTriangle, FiCheckCircle, FiAlertCircle, FiShield } from 'react-icons/fi';

const qualityConfig = {
  Low: {
    bg: 'bg-red-500/15',
    border: 'border-red-500/30',
    text: 'text-red-400',
    badge: 'bg-red-500',
    icon: <FiAlertTriangle className="text-2xl" />,
    glow: 'shadow-red-500/20',
  },
  Medium: {
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    badge: 'bg-amber-500',
    icon: <FiAlertCircle className="text-2xl" />,
    glow: 'shadow-amber-500/20',
  },
  High: {
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500',
    icon: <FiCheckCircle className="text-2xl" />,
    glow: 'shadow-emerald-500/20',
  },
};

const riskConfig = {
  Critical: { bg: 'bg-red-500', text: 'text-white' },
  High: { bg: 'bg-orange-500', text: 'text-white' },
  Moderate: { bg: 'bg-yellow-500', text: 'text-black' },
  None: { bg: 'bg-green-500', text: 'text-white' },
};

export default function PredictionResult({ result }) {
  if (!result) return null;

  const { water_quality, water_quality_detail, predicted_disease, disease_info, early_warning, actionable_recommendations } = result;
  const qc = qualityConfig[water_quality] || qualityConfig.Medium;
  const rc = riskConfig[disease_info?.risk_level] || riskConfig.Moderate;

  return (
    <div className="space-y-6 animate-in">
      {/* ── Water Quality Card ── */}
      <div className={`glass-card p-6 ${qc.border} border-2`}>
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-14 h-14 rounded-xl ${qc.bg} flex items-center justify-center ${qc.text} shadow-lg ${qc.glow}`}>
            {qc.icon}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{water_quality_detail.label}</h3>
            <p className="text-sm text-slate-400">{water_quality_detail.status}</p>
          </div>
          <span className={`ml-auto px-4 py-1.5 rounded-full ${qc.badge} text-white text-sm font-bold shadow-lg ${qc.glow}`}>
            {water_quality}
          </span>
        </div>

        {/* Limiting Factors */}
        {water_quality_detail.limiting_factors?.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-slate-300 mb-2">Limiting Factors</h4>
            <ul className="space-y-1">
              {water_quality_detail.limiting_factors.map((f, i) => (
                <li key={i} className={`text-sm ${qc.text} flex items-start gap-2`}>
                  <span className="mt-1">•</span> {f}
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-xs text-slate-500 mt-3">{water_quality_detail.compliance_summary}</p>
      </div>

      {/* ── Early Warning Alert ── */}
      <div className={`glass-card p-5 border-l-4 ${
        water_quality === 'Low' ? 'border-l-red-500 pulse-critical' : 
        water_quality === 'Medium' ? 'border-l-amber-500' : 'border-l-emerald-500'
      }`}>
        <p className="text-sm leading-relaxed">{early_warning}</p>
      </div>

      {/* ── Disease Prediction Card ── */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-4 mb-4">
          <FiShield className="text-2xl text-purple-400" />
          <div>
            <h3 className="text-xl font-bold text-white">{predicted_disease.replace(/_/g, ' ')}</h3>
            <p className="text-sm text-slate-400">{disease_info?.pathogen_type}</p>
          </div>
          <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${rc.bg} ${rc.text}`}>
            {disease_info?.risk_level} Risk
          </span>
        </div>
        <p className="text-sm text-slate-300 mb-4">{disease_info?.description}</p>

        {disease_info?.common_symptoms?.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-slate-300 mb-2">Common Symptoms</h4>
            <div className="flex flex-wrap gap-2">
              {disease_info.common_symptoms.map((s, i) => (
                <span key={i} className="text-xs bg-slate-700/50 text-slate-300 px-2.5 py-1 rounded-full">{s}</span>
              ))}
            </div>
          </div>
        )}

        {disease_info?.prevention_measures?.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-2">Prevention Measures</h4>
            <ul className="space-y-1">
              {disease_info.prevention_measures.map((m, i) => (
                <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span> {m}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── Actionable Recommendations ── */}
      {actionable_recommendations?.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <span className="text-cyan-400">📋</span> Actionable Recommendations
          </h3>
          <ol className="space-y-2">
            {actionable_recommendations.map((r, i) => (
              <li key={i} className="text-sm text-slate-300 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {r}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
