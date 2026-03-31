import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../../database/firebase';
import { Leaf, Recycle, Flame, Calendar, ScanLine } from 'lucide-react';
import { getLocalScans } from '../lib/demoStorage';

export default function Profile() {
  const { currentUser } = useAuth();
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    if (!db) {
      setScans(getLocalScans(currentUser.uid));
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'scans'),
      where('uid', '==', currentUser.uid),
      orderBy('timestamp', 'desc')
    );
    getDocs(q)
      .then((snap) => {
        setScans(snap.docs.map((d) => d.data()));
      })
      .catch((error) => {
        console.error(error);
        setScans(getLocalScans(currentUser.uid));
      })
      .finally(() => setLoading(false));
  }, [currentUser]);

  const categoryCounts = scans.reduce((acc: any, s) => {
    acc[s.category] = (acc[s.category] || 0) + 1;
    return acc;
  }, {});

  const stats = [
    {
      label: 'Total Scans',
      value: scans.length,
      icon: ScanLine,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Recyclable',
      value: categoryCounts['Recyclable'] || 0,
      icon: Recycle,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Organic',
      value: categoryCounts['Organic'] || 0,
      icon: Leaf,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Hazardous',
      value: categoryCounts['Hazardous'] || 0,
      icon: Flame,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
  ];

  const joinDate = currentUser?.metadata?.creationTime
    ? new Date(currentUser.metadata.creationTime).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown';

  const level =
    scans.length < 5
      ? 'Eco Beginner'
      : scans.length < 20
        ? 'Green Scout'
        : scans.length < 50
          ? 'Eco Warrior'
          : 'Planet Guardian';
  const nextLevelAt = scans.length < 5 ? 5 : scans.length < 20 ? 20 : scans.length < 50 ? 50 : 100;
  const progress = Math.min((scans.length / nextLevelAt) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-3xl space-y-10"
    >
      {/* Profile Hero */}
      <section className="from-primary/10 to-surface-container-low border-primary/10 flex flex-col items-center gap-8 rounded-[2.5rem] border bg-gradient-to-br p-10 md:flex-row">
        <div className="relative flex-shrink-0">
          <div className="h-32 w-32 overflow-hidden rounded-[2rem] border-4 border-white shadow-xl">
            <img
              src={
                currentUser?.photoURL ||
                `https://api.dicebear.com/7.x/identicon/svg?seed=${currentUser?.email}`
              }
              alt="Profile"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="bg-primary absolute -right-2 -bottom-2 rounded-full px-3 py-1 text-xs font-black text-white shadow-lg">
            ✦ {level.split(' ')[0]}
          </div>
        </div>
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-on-surface text-3xl font-extrabold">
            {currentUser?.displayName || 'Eco Explorer'}
          </h1>
          <p className="text-on-surface-variant mt-1 font-medium">{currentUser?.email}</p>
          <div className="mt-4 flex items-center gap-2">
            <Calendar className="text-on-surface-variant h-4 w-4" />
            <span className="text-on-surface-variant text-sm font-medium">
              Member since {joinDate}
            </span>
          </div>

          {/* Level Progress */}
          <div className="mt-6">
            <div className="mb-2 flex justify-between text-sm font-bold">
              <span className="text-primary">{level}</span>
              <span className="text-on-surface-variant">
                {scans.length}/{nextLevelAt} scans
              </span>
            </div>
            <div className="bg-surface-container-high h-3 w-full overflow-hidden rounded-full">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="from-primary to-primary-container h-full rounded-full bg-gradient-to-r"
              />
            </div>
            <p className="text-on-surface-variant mt-1 text-xs">
              {nextLevelAt - scans.length} more scans to next level
            </p>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section>
        <h2 className="text-on-surface mb-6 text-2xl font-extrabold">Your Eco Stats</h2>
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              whileHover={{ scale: 1.02 }}
              className="border-outline-variant/10 flex items-center gap-5 rounded-[2rem] border bg-white p-6 shadow-sm"
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${stat.bg}`}>
                <stat.icon className={`h-7 w-7 ${stat.color}`} />
              </div>
              <div>
                <p className="text-on-surface text-3xl font-extrabold">{stat.value}</p>
                <p className="text-on-surface-variant text-sm font-medium">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recent Scan History */}
      <section>
        <h2 className="text-on-surface mb-6 text-2xl font-extrabold">Recent Activity</h2>
        {loading ? (
          <div className="text-on-surface-variant py-12 text-center">Loading...</div>
        ) : scans.length === 0 ? (
          <div className="bg-surface-container-low border-outline-variant/10 rounded-[2rem] border py-16 text-center">
            <ScanLine className="text-on-surface-variant mx-auto mb-3 h-12 w-12" />
            <p className="text-on-surface-variant font-bold">
              No scans yet. Start classifying waste!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {scans.slice(0, 10).map((scan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="border-outline-variant/10 flex items-center gap-4 rounded-[1.5rem] border bg-white p-5 shadow-sm"
              >
                <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl">
                  <Leaf className="text-primary h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="text-on-surface font-bold">{scan.item}</p>
                  <p className="text-on-surface-variant text-xs">
                    {scan.category} ·{' '}
                    {scan.inputMethod === 'image'
                      ? '📷 Image'
                      : scan.inputMethod === 'camera'
                        ? '📸 Camera'
                        : '✏️ Text'}{' '}
                    · {new Date(scan.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-black tracking-wider uppercase ${
                    scan.category === 'Recyclable'
                      ? 'bg-blue-100 text-blue-700'
                      : scan.category === 'Organic'
                        ? 'bg-green-100 text-green-700'
                        : scan.category === 'Hazardous'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
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
