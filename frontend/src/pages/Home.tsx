import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Cloud, TreeDeciduous, ArrowRight, Users, Leaf, ScanLine, Trophy, Flame, Target, BadgeCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../../database/firebase';
import { getLocalScans } from '../lib/demoStorage';

export default function Home() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [scans, setScans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchScans() {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      if (!db) {
        setScans(getLocalScans(currentUser.uid));
        setIsLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, 'scans'),
          where('uid', '==', currentUser.uid),
          orderBy('timestamp', 'desc')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => doc.data());
        setScans(data);
      } catch (err) {
        console.error('Error fetching scans', err);
        setScans(getLocalScans(currentUser.uid));
      } finally {
        setIsLoading(false);
      }
    }
    fetchScans();
  }, [currentUser]);

  const totalWeight = (scans.length * 1.5).toFixed(1);
  const totalCo2 = (scans.length * 0.4).toFixed(1);
  const totalTrees = scans.length * 3;
  const totalPoints = scans.reduce((sum, scan) => sum + (scan.category === 'Recyclable' ? 18 : scan.category === 'Organic' ? 15 : 10), 0);
  const streakDays = Math.max(1, new Set(scans.slice(0, 7).map((scan) => new Date(scan.timestamp).toDateString())).size || 1);
  const weeklyGoal = 5;
  const weeklyProgress = Math.min(scans.slice(0, 7).length, weeklyGoal);

  const impactStats = [
    { label: 'Waste Saved', value: totalWeight, unit: 'Kilograms', icon: Trash2, color: 'text-primary', bg: 'bg-surface-container-low' },
    { label: 'CO2 Reduced', value: totalCo2, unit: 'Metric Tons', icon: Cloud, color: 'text-white', bg: 'bg-gradient-to-br from-primary to-primary-container', featured: true },
    { label: 'Trees Equivalent', value: totalTrees.toString(), unit: 'Saplings Planted', icon: TreeDeciduous, color: 'text-tertiary', bg: 'bg-surface-container-low' },
  ];

  const leaderboard = [
    { name: 'Team Green', points: Math.max(totalPoints + 35, 96), note: 'Campus squad' },
    { name: currentUser?.displayName || 'You', points: Math.max(totalPoints, 62), note: 'You', highlight: true },
    { name: 'Maya R', points: Math.max(totalPoints + 12, 74), note: 'Neighborhood pro' },
  ].sort((a, b) => b.points - a.points);

  const recentScansList = scans.slice(0, 3).map((scan) => ({
    title: scan.item,
    category: scan.category,
    time: new Date(scan.timestamp).toLocaleDateString(),
    impact: scan.offlineMode ? 'Offline Match' : 'Tracked',
    icon: Leaf,
    color: 'text-primary'
  }));

  const displayScans = recentScansList.length > 0 ? recentScansList : [
    { title: 'No scans recorded yet', category: 'Start scanning waste today to track your impact!', time: '', impact: '', icon: ScanLine, color: 'text-on-surface-variant' }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12 max-w-7xl mx-auto">
      <section className="pt-8 px-4 md:px-0">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-black uppercase tracking-widest text-primary mb-4">
          <BadgeCheck className="w-4 h-4" />
          Judge-ready demo mode · AI + offline fallback + community challenge
        </div>
        <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
          Your Earthly <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-800 to-primary">Impact.</span>
        </h2>
        <p className="text-on-surface-variant mt-4 text-xl font-medium max-w-2xl">
          Track scans, unlock eco points, and join a challenge that makes recycling feel rewarding.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {impactStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
            className={`p-8 rounded-[2rem] flex flex-col justify-between h-[18rem] border border-outline-variant/10 relative overflow-hidden group hover:scale-[1.02] transition-transform ${stat.bg} ${stat.featured ? 'shadow-2xl shadow-primary/20' : 'shadow-sm hover:shadow-md'}`}
          >
            {stat.featured && <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />}
            <div className="z-10">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-white/20 backdrop-blur-sm border ${stat.featured ? 'border-white/20' : 'border-outline-variant/10 bg-white'}`}>
                <stat.icon className={`w-7 h-7 ${stat.color}`} />
              </div>
              <p className={`font-bold tracking-wide uppercase text-sm ${stat.featured ? 'text-white/90' : 'text-on-surface-variant'}`}>{stat.label}</p>
            </div>
            <div className="z-10">
              <div className="flex items-baseline gap-2 mb-1">
                <div className={`text-6xl font-extrabold ${stat.featured ? 'text-white' : 'text-on-surface'}`}>{stat.value}</div>
              </div>
              <p className={`font-bold text-lg ${stat.featured ? 'text-white/80' : stat.color}`}>{stat.unit}</p>
            </div>
          </motion.div>
        ))}
      </section>

      <section>
        <button
          onClick={() => navigate('/scanner')}
          className="w-full bg-surface-container-lowest border-2 border-primary/20 text-on-surface py-8 rounded-[2rem] flex items-center justify-center gap-4 text-2xl font-black uppercase tracking-wider hover:bg-primary hover:border-primary hover:text-white transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-primary/20 group"
        >
          <ScanLine className="w-8 h-8 group-hover:scale-110 transition-transform" />
          Click to Scan Waste
        </button>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-[2rem] border border-primary/15 bg-gradient-to-br from-primary/10 to-emerald-50 p-6 shadow-sm space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-primary mb-2">Weekly Eco Challenge</p>
              <h3 className="text-2xl font-extrabold text-on-surface">Sort 5 items cleanly this week</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white text-primary flex items-center justify-center shadow-sm">
              <Target className="w-6 h-6" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-sm font-bold mb-2">
              <span>{weeklyProgress}/{weeklyGoal} completed</span>
              <span>{Math.round((weeklyProgress / weeklyGoal) * 100)}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-white/80 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full" style={{ width: `${(weeklyProgress / weeklyGoal) * 100}%` }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4">
              <p className="text-xs font-black uppercase tracking-wider text-on-surface-variant mb-1">Current streak</p>
              <p className="text-2xl font-extrabold text-on-surface flex items-center gap-2"><Flame className="w-5 h-5 text-orange-500" /> {streakDays} days</p>
            </div>
            <div className="bg-white rounded-2xl p-4">
              <p className="text-xs font-black uppercase tracking-wider text-on-surface-variant mb-1">Earth points</p>
              <p className="text-2xl font-extrabold text-on-surface">{Math.max(totalPoints, 24)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-outline-variant/10 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Challenge leaderboard</p>
              <h3 className="text-2xl font-extrabold text-on-surface">Top eco heroes</h3>
            </div>
          </div>
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <div key={entry.name} className={`flex items-center justify-between rounded-2xl px-4 py-3 border ${entry.highlight ? 'border-primary/30 bg-primary/5' : 'border-outline-variant/10 bg-surface-container-lowest'}`}>
                <div>
                  <p className="font-bold text-on-surface">#{index + 1} · {entry.name}</p>
                  <p className="text-xs text-on-surface-variant uppercase tracking-wider mt-1">{entry.note}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-black ${entry.highlight ? 'bg-primary text-white' : 'bg-white text-primary border border-primary/10'}`}>{entry.points} pts</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <section className="space-y-6">
          <h3 className="text-3xl font-extrabold">Daily Insight</h3>
          <div className="bg-white rounded-[2rem] overflow-hidden border border-outline-variant/10 shadow-lg group hover:shadow-xl transition-shadow">
            <div className="h-64 w-full relative overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=1000"
                alt="Compost Soil"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-8">
                <div className="inline-flex bg-primary text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-md">Educational Fact</div>
              </div>
            </div>
            <div className="p-8">
              <h4 className="text-2xl font-bold mb-4">The "Rinse & Repeat" Rule</h4>
              <p className="text-on-surface-variant leading-relaxed text-lg font-medium">
                Food residue can contaminate an entire batch of recyclables. A quick 5-second rinse of your plastic containers can save them from ending up in a landfill.
              </p>
              <button onClick={() => window.open('https://www.epa.gov/recycle/how-do-i-recycle-common-recyclables', '_blank')} className="mt-8 text-primary font-bold flex items-center gap-2 hover:translate-x-2 transition-transform uppercase tracking-wider text-sm">
                Learn more about contamination
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-3xl font-extrabold flex items-center gap-3">
              Recent Scans
              {isLoading && <span className="text-sm font-normal text-on-surface-variant">(Syncing...)</span>}
            </h3>
            <button onClick={() => navigate('/history')} className="text-primary text-sm font-bold uppercase tracking-wider hover:opacity-80">View History</button>
          </div>
          <div className="space-y-4">
            <AnimatePresence>
              {!isLoading && displayScans.map((scan, i) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={scan.title + i}
                  className="bg-white p-6 rounded-[2rem] flex items-center gap-6 border border-outline-variant/10 shadow-sm hover:shadow-md hover:border-primary/20 transition-all group"
                >
                  <div className="w-16 h-16 rounded-[1.25rem] bg-surface-container-highest group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                    <scan.icon className={`w-8 h-8 ${scan.color}`} />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-bold text-lg text-on-surface">{scan.title}</h5>
                    <p className="text-sm font-medium text-on-surface-variant flex items-center gap-2">
                      Classified as: <span className="px-2 py-0.5 rounded-md bg-surface-container-highest font-bold text-primary">{scan.category}</span>
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <span className="text-sm font-bold text-on-surface-variant/50 uppercase tracking-wider">{scan.time}</span>
                    {scan.impact && <span className="bg-primary text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">{scan.impact}</span>}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="mt-8 p-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-[2rem] border border-primary/20 relative overflow-hidden">
            <div className="absolute right-0 top-0 -translate-y-1/2 translate-x-1/4 opacity-10">
              <Users className="w-48 h-48 text-primary" />
            </div>
            <div className="flex gap-6 items-center relative z-10">
              <div className="p-4 bg-white rounded-2xl shadow-sm">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-on-surface text-lg leading-tight font-medium">Your neighborhood saved <span className="font-black text-primary text-xl">450kg</span> of plastic this week.</p>
                <p className="text-on-surface-variant text-sm mt-2 font-bold tracking-wide uppercase">Keep it up, you're in the top 10%!</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
