import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../../database/firebase';
import { Leaf, Recycle, Flame, Droplets, Award, Calendar, ScanLine } from 'lucide-react';

export default function Profile() {
  const { currentUser } = useAuth();
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'scans'), where('uid', '==', currentUser.uid), orderBy('timestamp', 'desc'));
    getDocs(q).then(snap => {
      setScans(snap.docs.map(d => d.data()));
    }).catch(console.error).finally(() => setLoading(false));
  }, [currentUser]);

  const categoryCounts = scans.reduce((acc: any, s) => {
    acc[s.category] = (acc[s.category] || 0) + 1;
    return acc;
  }, {});

  const stats = [
    { label: 'Total Scans', value: scans.length, icon: ScanLine, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Recyclable', value: categoryCounts['Recyclable'] || 0, icon: Recycle, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Organic', value: categoryCounts['Organic'] || 0, icon: Leaf, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Hazardous', value: categoryCounts['Hazardous'] || 0, icon: Flame, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  const joinDate = currentUser?.metadata?.creationTime
    ? new Date(currentUser.metadata.creationTime).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Unknown';

  const level = scans.length < 5 ? 'Eco Beginner' : scans.length < 20 ? 'Green Scout' : scans.length < 50 ? 'Eco Warrior' : 'Planet Guardian';
  const nextLevelAt = scans.length < 5 ? 5 : scans.length < 20 ? 20 : scans.length < 50 ? 50 : 100;
  const progress = Math.min((scans.length / nextLevelAt) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-10"
    >
      {/* Profile Hero */}
      <section className="bg-gradient-to-br from-primary/10 to-surface-container-low rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-8 border border-primary/10">
        <div className="relative flex-shrink-0">
          <div className="w-32 h-32 rounded-[2rem] overflow-hidden border-4 border-white shadow-xl">
            <img
              src={currentUser?.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${currentUser?.email}`}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-primary text-white text-xs font-black px-3 py-1 rounded-full shadow-lg">
            ✦ {level.split(' ')[0]}
          </div>
        </div>
        <div className="text-center md:text-left flex-1">
          <h1 className="text-3xl font-extrabold text-on-surface">
            {currentUser?.displayName || 'Eco Explorer'}
          </h1>
          <p className="text-on-surface-variant mt-1 font-medium">{currentUser?.email}</p>
          <div className="mt-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-on-surface-variant" />
            <span className="text-sm text-on-surface-variant font-medium">Member since {joinDate}</span>
          </div>

          {/* Level Progress */}
          <div className="mt-6">
            <div className="flex justify-between text-sm font-bold mb-2">
              <span className="text-primary">{level}</span>
              <span className="text-on-surface-variant">{scans.length}/{nextLevelAt} scans</span>
            </div>
            <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full"
              />
            </div>
            <p className="text-xs text-on-surface-variant mt-1">{nextLevelAt - scans.length} more scans to next level</p>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section>
        <h2 className="text-2xl font-extrabold mb-6 text-on-surface">Your Eco Stats</h2>
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              whileHover={{ scale: 1.02 }}
              className="bg-white p-6 rounded-[2rem] border border-outline-variant/10 shadow-sm flex items-center gap-5"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={`w-7 h-7 ${stat.color}`} />
              </div>
              <div>
                <p className="text-3xl font-extrabold text-on-surface">{stat.value}</p>
                <p className="text-sm font-medium text-on-surface-variant">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recent Scan History */}
      <section>
        <h2 className="text-2xl font-extrabold mb-6 text-on-surface">Recent Activity</h2>
        {loading ? (
          <div className="text-center py-12 text-on-surface-variant">Loading...</div>
        ) : scans.length === 0 ? (
          <div className="text-center py-16 bg-surface-container-low rounded-[2rem] border border-outline-variant/10">
            <ScanLine className="w-12 h-12 text-on-surface-variant mx-auto mb-3" />
            <p className="font-bold text-on-surface-variant">No scans yet. Start classifying waste!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {scans.slice(0, 10).map((scan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 bg-white p-5 rounded-[1.5rem] border border-outline-variant/10 shadow-sm"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-on-surface">{scan.item}</p>
                  <p className="text-xs text-on-surface-variant">
                    {scan.category} · {scan.inputMethod === 'image' ? '📷 Image' : scan.inputMethod === 'camera' ? '📸 Camera' : '✏️ Text'} · {new Date(scan.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                  scan.category === 'Recyclable' ? 'bg-blue-100 text-blue-700' :
                  scan.category === 'Organic' ? 'bg-green-100 text-green-700' :
                  scan.category === 'Hazardous' ? 'bg-red-100 text-red-700' :
                  'bg-surface-container text-on-surface-variant'
                }`}>
                  {scan.category}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </motion.div>
  );
}
