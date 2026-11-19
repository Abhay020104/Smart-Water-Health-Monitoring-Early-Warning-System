import { useState } from 'react';
import { FiSend, FiRefreshCw, FiDroplet } from 'react-icons/fi';
import { predictWaterQuality } from '../api';
import PredictionResult from '../components/PredictionResult';

const WATER_SOURCES = ['Borewell', 'Open Well', 'Piped', 'Pond', 'Rainwater', 'River', 'Tanker'];
const WATER_TREATMENTS = ['Boiled', 'Chlorinated', 'Filtered', 'Untreated'];

const defaultValues = {
  state: 'Uttar Pradesh',
  district: 'Varanasi',
  water_source: 'Piped',
  water_treatment: 'Chlorinated',
  ph: 7.2,
  turbidity_ntu: 2.5,
  dissolved_oxygen_mg_l: 8.0,
  bod_mg_l: 2.0,
  fecal_coliform_per_100ml: 20,
  total_coliform_per_100ml: 50,
  tds_mg_l: 250,
  nitrate_mg_l: 8.0,
  fluoride_mg_l: 0.7,
  arsenic_ug_l: 2.0,
  open_defecation_rate: 5.0,
  avg_temperature_c: 26.0,
  avg_rainfall_mm: 50.0,
  avg_humidity_pct: 60.0,
  flooding: 0,
  symptom_diarrhea: 0,
  symptom_vomiting: 0,
  symptom_fever: 0,
  symptom_abdominal_pain: 0,
  symptom_dehydration: 0,
  symptom_jaundice: 0,
  symptom_bloody_stool: 0,
  symptom_skin_rash: 0,
};

const chemFields = [
  { key: 'ph', label: 'pH Level', hint: 'BIS Standard: 6.5–8.5', min: 0, max: 14, step: 0.1 },
  { key: 'turbidity_ntu', label: 'Turbidity (NTU)', hint: 'Ideal: < 5 NTU', min: 0, max: 500, step: 0.5 },
  { key: 'dissolved_oxygen_mg_l', label: 'Dissolved Oxygen (mg/L)', hint: 'Ideal: > 6.0', min: 0, max: 20, step: 0.1 },
  { key: 'bod_mg_l', label: 'BOD (mg/L)', hint: 'Ideal: < 3.0', min: 0, max: 100, step: 0.5 },
  { key: 'fecal_coliform_per_100ml', label: 'Fecal Coliform (per 100ml)', hint: 'Standard: 0', min: 0, max: 50000, step: 10 },
  { key: 'total_coliform_per_100ml', label: 'Total Coliform (per 100ml)', hint: 'Standard: 0', min: 0, max: 50000, step: 10 },
  { key: 'tds_mg_l', label: 'TDS (mg/L)', hint: 'Ideal: < 500', min: 0, max: 5000, step: 10 },
  { key: 'nitrate_mg_l', label: 'Nitrate (mg/L)', hint: 'Max: 45', min: 0, max: 200, step: 0.5 },
  { key: 'fluoride_mg_l', label: 'Fluoride (mg/L)', hint: 'Standard: 0.6–1.2', min: 0, max: 10, step: 0.05 },
  { key: 'arsenic_ug_l', label: 'Arsenic (μg/L)', hint: 'WHO Max: 10', min: 0, max: 200, step: 0.5 },
];

const envFields = [
  { key: 'open_defecation_rate', label: 'Open Defecation Rate (%)', min: 0, max: 100, step: 0.5 },
  { key: 'avg_temperature_c', label: 'Avg Temperature (°C)', min: -10, max: 55, step: 0.5 },
  { key: 'avg_rainfall_mm', label: 'Avg Rainfall (mm)', min: 0, max: 1000, step: 5 },
  { key: 'avg_humidity_pct', label: 'Avg Humidity (%)', min: 0, max: 100, step: 1 },
];

const symptomFields = [
  { key: 'symptom_diarrhea', label: 'Diarrhea' },
  { key: 'symptom_vomiting', label: 'Vomiting' },
  { key: 'symptom_fever', label: 'Fever' },
  { key: 'symptom_abdominal_pain', label: 'Abdominal Pain' },
  { key: 'symptom_dehydration', label: 'Dehydration' },
  { key: 'symptom_jaundice', label: 'Jaundice' },
  { key: 'symptom_bloody_stool', label: 'Bloody Stool' },
  { key: 'symptom_skin_rash', label: 'Skin Rash' },
];

export default function Predict() {
  const [form, setForm] = useState({ ...defaultValues });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const payload = {
        ...form,
        ph: parseFloat(form.ph),
        turbidity_ntu: parseFloat(form.turbidity_ntu),
        dissolved_oxygen_mg_l: parseFloat(form.dissolved_oxygen_mg_l),
        bod_mg_l: parseFloat(form.bod_mg_l),
        fecal_coliform_per_100ml: parseInt(form.fecal_coliform_per_100ml),
        total_coliform_per_100ml: parseInt(form.total_coliform_per_100ml),
        tds_mg_l: parseFloat(form.tds_mg_l),
        nitrate_mg_l: parseFloat(form.nitrate_mg_l),
        fluoride_mg_l: parseFloat(form.fluoride_mg_l),
        arsenic_ug_l: parseFloat(form.arsenic_ug_l),
        open_defecation_rate: parseFloat(form.open_defecation_rate),
        avg_temperature_c: parseFloat(form.avg_temperature_c),
        avg_rainfall_mm: parseFloat(form.avg_rainfall_mm),
        avg_humidity_pct: parseFloat(form.avg_humidity_pct),
        flooding: parseInt(form.flooding),
        symptom_diarrhea: parseInt(form.symptom_diarrhea),
        symptom_vomiting: parseInt(form.symptom_vomiting),
        symptom_fever: parseInt(form.symptom_fever),
        symptom_abdominal_pain: parseInt(form.symptom_abdominal_pain),
        symptom_dehydration: parseInt(form.symptom_dehydration),
        symptom_jaundice: parseInt(form.symptom_jaundice),
        symptom_bloody_stool: parseInt(form.symptom_bloody_stool),
        symptom_skin_rash: parseInt(form.symptom_skin_rash),
      };
      const res = await predictWaterQuality(payload);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to connect to API. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm({ ...defaultValues });
    setResult(null);
    setError('');
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* ── Form Panel ── */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Water Quality Analysis</h2>
        <p className="text-sm text-slate-400 mb-6">Enter water sample parameters and patient symptoms for prediction</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Location */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3">📍 Location Info (Optional)</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">State</label>
                <input type="text" value={form.state} onChange={(e) => updateField('state', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white focus:border-cyan-500 focus:outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">District</label>
                <input type="text" value={form.district} onChange={(e) => updateField('district', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white focus:border-cyan-500 focus:outline-none transition-colors" />
              </div>
            </div>
          </div>

          {/* Water Source & Treatment */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3">🚰 Water Source & Treatment</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Water Source</label>
                <select value={form.water_source} onChange={(e) => updateField('water_source', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white focus:border-cyan-500 focus:outline-none transition-colors">
                  {WATER_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Treatment</label>
                <select value={form.water_treatment} onChange={(e) => updateField('water_treatment', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white focus:border-cyan-500 focus:outline-none transition-colors">
                  {WATER_TREATMENTS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Water Chemistry */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3">🧪 Water Chemistry Parameters</h3>
            <div className="grid grid-cols-2 gap-3">
              {chemFields.map((f) => (
                <div key={f.key}>
                  <label className="block text-xs text-slate-400 mb-1">{f.label}</label>
                  <input type="number" value={form[f.key]} onChange={(e) => updateField(f.key, e.target.value)}
                    min={f.min} max={f.max} step={f.step}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white focus:border-cyan-500 focus:outline-none transition-colors" />
                  <span className="text-xs text-slate-500">{f.hint}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Environmental Conditions */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3">🌡️ Environmental Conditions</h3>
            <div className="grid grid-cols-2 gap-3">
              {envFields.map((f) => (
                <div key={f.key}>
                  <label className="block text-xs text-slate-400 mb-1">{f.label}</label>
                  <input type="number" value={form[f.key]} onChange={(e) => updateField(f.key, e.target.value)}
                    min={f.min} max={f.max} step={f.step}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white focus:border-cyan-500 focus:outline-none transition-colors" />
                </div>
              ))}
              <div className="col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" checked={form.flooding === 1} onChange={(e) => updateField('flooding', e.target.checked ? 1 : 0)}
                      className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-700 rounded-full peer-checked:bg-cyan-500 transition-colors"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition-transform"></div>
                  </div>
                  <span className="text-sm text-slate-300">Flooding in Area</span>
                </label>
              </div>
            </div>
          </div>

          {/* Symptoms */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3">🩺 Patient Symptoms</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {symptomFields.map((f) => (
                <label key={f.key} className={`flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border transition-all duration-200
                  ${form[f.key] === 1
                    ? 'bg-red-500/15 border-red-500/40 text-red-300'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}>
                  <input type="checkbox" checked={form[f.key] === 1} onChange={(e) => updateField(f.key, e.target.checked ? 1 : 0)}
                    className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0" />
                  <span className="text-xs font-medium">{f.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button type="submit" disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
              {loading ? (
                <><FiRefreshCw className="animate-spin" /> Analyzing...</>
              ) : (
                <><FiSend /> Analyze Water Sample</>
              )}
            </button>
            <button type="button" onClick={handleReset}
              className="px-4 py-3 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-colors">
              <FiRefreshCw />
            </button>
          </div>
        </form>
      </div>

      {/* ── Results Panel ── */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Prediction Results</h2>
        <p className="text-sm text-slate-400 mb-6">Analysis output will appear here after submission</p>

        {error && (
          <div className="glass-card p-4 border-l-4 border-l-red-500 mb-4">
            <p className="text-sm text-red-400">⚠ {error}</p>
          </div>
        )}

        {result ? (
          <PredictionResult result={result} />
        ) : (
          <div className="glass-card p-12 text-center">
            <FiDroplet className="text-5xl text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500">Submit a water sample to see analysis results</p>
            <p className="text-xs text-slate-600 mt-2">The system responds to even a single parameter change</p>
          </div>
        )}
      </div>
    </div>
  );
}
