import React from 'react';
import { motion } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, Trash2, MapPin, Zap, Info, Share2, ShieldCheck, Award, CheckCircle2, WifiOff } from 'lucide-react';
import { WasteClassification } from '@/src/services/gemini';
import toast from 'react-hot-toast';

const fallbackTips: Record<string, string[]> = {
  Recyclable: ['Rinse off visible residue', 'Keep the item dry', 'Avoid mixing it with food waste'],
  Organic: ['Remove wrappers or stickers', 'Keep compostables separate from plastic', 'Drain excess liquid if possible'],
  Hazardous: ['Do not mix with household recycling', 'Store safely until drop-off', 'Handle with care and avoid heat'],
  'Non-Recyclable': ['Empty the item fully', 'Avoid contaminating clean recyclables', 'Check for specialized collection near you'],
  Unknown: ['When unsure, keep it out of the recycling stream', 'Use the text classifier for a better match', 'Follow your local waste guide'],
};

export default function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const { result, image } = (location.state as { result: WasteClassification; image?: string }) || {};

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <Info className="w-16 h-16 text-on-surface-variant mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Result Found</h2>
        <p className="text-on-surface-variant mb-6">Please try scanning an item again.</p>
        <button onClick={() => navigate('/scanner')} className="bg-primary text-white px-8 py-3 rounded-full font-bold">
          Go to Scanner
        </button>
      </div>
    );
  }

  const contaminationTips = result.contaminationTips?.length ? result.contaminationTips : fallbackTips[result.category] || fallbackTips.Unknown;
  const rewardBadge = result.rewardBadge || (result.category === 'Recyclable' ? 'Circular Hero' : result.category === 'Organic' ? 'Compost Champion' : 'Eco Explorer');
  const earthPoints = Math.max(12, Math.round(result.ecoScore * 1.15 + contaminationTips.length * 4));
  const shareText = `I used The Biome to classify ${result.item} as ${result.category} and could save ${result.co2Savings} of CO₂ with proper disposal. #Hackathon #Sustainability`;

  const handleCopyReceipt = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success('Impact receipt copied');
    } catch {
      toast.error('Could not copy the receipt');
    }
  };

  if (result.category === 'Unknown') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-full p-6 text-center max-w-lg mx-auto"
      >
        <div className="w-24 h-24 mb-6 rounded-3xl bg-surface-container-high flex items-center justify-center text-on-surface-variant shadow-inner">
          <Info className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-bold mb-3">Item Not Recognized</h2>
        <p className="text-on-surface-variant mb-8 text-lg">{result.guidance || "We couldn't positively identify this as a waste item. Please try again with a clearer photo."}</p>
        <button
          onClick={() => navigate('/scanner')}
          className="w-full bg-gradient-to-r from-primary to-primary-container text-white py-4 rounded-full font-bold text-lg shadow-lg active:scale-95 transition-transform"
        >
          Try Scanning Again
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="px-6 space-y-8 max-w-3xl mx-auto">
      <section className="relative">
        <div className="w-full aspect-[4/5] rounded-3xl overflow-hidden relative shadow-2xl">
          <img
            src={image || "https://images.unsplash.com/photo-1526951521990-620dc14c214b?auto=format&fit=crop&q=80&w=1000"}
            alt="Captured item"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          <div className="absolute top-5 left-5 flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full bg-white/90 text-primary text-xs font-black uppercase tracking-wider">
              {rewardBadge}
            </span>
            {result.offlineMode && (
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black uppercase tracking-wider flex items-center gap-1">
                <WifiOff className="w-3 h-3" /> Offline Smart Mode
              </span>
            )}
          </div>

          <div className="absolute bottom-6 left-6 right-6 p-6 glass-effect rounded-2xl shadow-xl border border-white/20">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Detection Result</p>
            <h1 className="text-2xl font-extrabold text-on-surface leading-tight">
              {result.category.toUpperCase()} - {result.item}
            </h1>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4">
        <div className="p-6 bg-surface-container-low rounded-3xl flex flex-col items-center justify-center text-center border border-outline-variant/10">
          <div className="relative w-20 h-20 mb-3 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle className="text-surface-container-high" cx="40" cy="40" fill="transparent" r="36" stroke="currentColor" strokeWidth="6" />
              <motion.circle
                initial={{ strokeDashoffset: 226 }}
                animate={{ strokeDashoffset: 226 - (226 * result.ecoScore) / 100 }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                className="text-primary"
                cx="40"
                cy="40"
                fill="transparent"
                r="36"
                stroke="currentColor"
                strokeDasharray="226"
                strokeWidth="6"
              />
            </svg>
            <span className="absolute text-xl font-bold text-on-surface">{result.ecoScore}</span>
          </div>
          <p className="text-sm font-semibold text-on-surface">Eco-Score</p>
          <p className="text-xs text-on-surface-variant">{result.ecoScore > 70 ? 'High Impact' : 'Moderate Impact'}</p>
        </div>

        <div className="p-6 bg-surface-container-low rounded-3xl flex flex-col items-center justify-center text-center border border-outline-variant/10">
          <div className="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center mb-3 text-primary">
            <Zap className="w-6 h-6 fill-current" />
          </div>
          <p className="text-sm font-semibold text-on-surface">CO2 Savings</p>
          <p className="text-xs text-on-surface-variant">{result.co2Savings}</p>
        </div>
      </section>

      <section className="bg-primary/5 p-8 rounded-3xl space-y-4 border border-primary/10">
        <div className="flex items-start gap-5">
          <div className="bg-primary p-4 rounded-2xl text-white">
            <Trash2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-on-surface mb-1">Place in the {result.binColor} Bin</h2>
            <p className="text-on-surface-variant text-sm leading-relaxed">{result.guidance}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/10 to-emerald-50 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-primary">Impact Receipt</p>
              <h3 className="text-2xl font-extrabold text-on-surface">+{earthPoints} Earth Points</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white text-primary flex items-center justify-center shadow-sm">
              <Award className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            {result.impactFact || `Properly sorting ${result.item.toLowerCase()} helps keep valuable materials in circulation.`}
          </p>
          <button
            onClick={handleCopyReceipt}
            className="w-full rounded-full bg-white text-primary font-bold px-4 py-3 flex items-center justify-center gap-2 border border-primary/10 hover:bg-primary hover:text-white transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Copy shareable receipt
          </button>
        </div>

        <div className="rounded-3xl border border-outline-variant/10 bg-white p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-on-surface">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-extrabold">Contamination Check</h3>
          </div>
          <div className="space-y-3">
            {contaminationTips.map((tip) => (
              <div key={tip} className="flex items-start gap-3 text-sm text-on-surface-variant">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-bold tracking-wide uppercase">AI Insight</span>
          </div>
          <div className="p-8 bg-white border-l-4 border-primary rounded-r-3xl shadow-sm">
            <p className="text-lg text-on-surface leading-relaxed italic">"{result.insight}"</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {result.materials.map((material) => (
            <span key={material} className="px-5 py-2 bg-surface-container-high text-on-surface-variant rounded-full text-sm font-medium">
              {material}
            </span>
          ))}
        </div>
      </section>

      <section className="pt-2 space-y-4">
        <button
          onClick={() => navigate('/map', { state: { category: result.category, item: result.item } })}
          className="w-full py-5 bg-gradient-to-br from-primary to-primary-container text-white rounded-full font-bold text-lg flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-lg shadow-primary/20"
        >
          <MapPin className="w-6 h-6" />
          Find Nearby {result.binColor} Bin
        </button>
        <button
          onClick={() => navigate('/scanner')}
          className="w-full py-4 bg-surface-container-low text-green-900 rounded-full font-bold text-base flex items-center justify-center gap-3 transition-transform active:scale-95 border border-outline-variant/10 hover:bg-green-50"
        >
          Scan Another Item
        </button>
      </section>
    </motion.div>
  );
}
