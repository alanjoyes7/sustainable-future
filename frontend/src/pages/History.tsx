import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../database/firebase';
import { Leaf, Trash2, Search, ScanLine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { deleteLocalScan, getLocalScans } from '../lib/demoStorage';

export default function History() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  const fetchScans = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    if (!db) {
      setScans(getLocalScans(currentUser.uid));
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'scans'),
        where('uid', '==', currentUser.uid),
        orderBy('timestamp', 'desc')
      );
      const snap = await getDocs(q);
      setScans(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
      setScans(getLocalScans(currentUser.uid));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, [currentUser]);

  const handleDelete = async (scanId: string) => {
    if (!db) {
      deleteLocalScan(scanId);
      setScans((prev) => prev.filter((s) => s.id !== scanId));
      toast.success('Scan deleted');
      return;
    }

    try {
      await deleteDoc(doc(db, 'scans', scanId));
      setScans((prev) => prev.filter((s) => s.id !== scanId));
      toast.success('Scan deleted');
    } catch {
      deleteLocalScan(scanId);
      setScans((prev) => prev.filter((s) => s.id !== scanId));
      toast.success('Scan deleted locally');
    }
  };

  const filteredScans = scans
    .filter((s) => filterCategory === 'All' || s.category === filterCategory)
    .filter((s) => !search || s.item?.toLowerCase().includes(search.toLowerCase()));

  const categories = ['All', 'Recyclable', 'Organic', 'Hazardous', 'Non-Recyclable'];

  const categoryStyle: Record<string, string> = {
    Recyclable: 'bg-blue-100 text-blue-700',
    Organic: 'bg-green-100 text-green-700',
    Hazardous: 'bg-red-100 text-red-700',
    'Non-Recyclable': 'bg-gray-100 text-gray-700',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-3xl space-y-8"
    >
      <section>
        <h1 className="text-on-surface mb-2 text-4xl font-extrabold">Scan History</h1>
        <p className="text-on-surface-variant font-medium">All your classified waste items</p>
      </section>

      {/* Search + Filter */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="text-on-surface-variant absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your scans..."
            className="border-outline-variant/10 text-on-surface focus:ring-primary/20 w-full rounded-2xl border bg-white py-4 pr-4 pl-12 font-medium shadow-sm outline-none focus:ring-2"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`flex-shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all active:scale-95 ${
                filterCategory === cat
                  ? 'bg-primary text-white shadow-md'
                  : 'border-outline-variant/10 border bg-white text-green-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="border-outline-variant/10 rounded-2xl border bg-white p-4 text-center shadow-sm">
          <p className="text-primary text-2xl font-extrabold">{scans.length}</p>
          <p className="text-on-surface-variant mt-1 text-xs font-bold">Total Scans</p>
        </div>
        <div className="border-outline-variant/10 rounded-2xl border bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-extrabold text-blue-600">
            {scans.filter((s) => s.category === 'Recyclable').length}
          </p>
          <p className="text-on-surface-variant mt-1 text-xs font-bold">Recyclable</p>
        </div>
        <div className="border-outline-variant/10 rounded-2xl border bg-white p-4 text-center shadow-sm">
          <p className="text-2xl font-extrabold text-green-600">
            {scans.filter((s) => s.category === 'Organic').length}
          </p>
          <p className="text-on-surface-variant mt-1 text-xs font-bold">Organic</p>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-on-surface-variant py-20 text-center">Loading history...</div>
      ) : filteredScans.length === 0 ? (
        <div className="bg-surface-container-low border-outline-variant/10 rounded-[2rem] border py-20 text-center">
          <ScanLine className="text-on-surface-variant mx-auto mb-4 h-14 w-14" />
          <h3 className="text-on-surface mb-2 text-xl font-extrabold">No scans found</h3>
          <p className="text-on-surface-variant mb-6">
            Try a different filter or start scanning waste!
          </p>
          <button
            onClick={() => navigate('/scanner')}
            className="bg-primary rounded-full px-8 py-3 text-sm font-bold text-white shadow-md transition-transform active:scale-95"
          >
            Go to Scanner
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredScans.map((scan, i) => (
              <motion.div
                key={scan.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.03 }}
                className="border-outline-variant/10 group flex items-center gap-4 rounded-[1.5rem] border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="bg-primary/10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl">
                  <Leaf className="text-primary h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-on-surface truncate font-bold">{scan.item}</p>
                  <p className="text-on-surface-variant mt-0.5 text-xs">
                    {new Date(scan.timestamp).toLocaleString()} ·{' '}
                    {scan.inputMethod === 'camera'
                      ? '📸 Camera'
                      : scan.inputMethod === 'image'
                        ? '🖼️ Upload'
                        : '✏️ Text'}
                  </p>
                </div>
                <span
                  className={`hidden flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-black tracking-wider uppercase sm:inline-flex ${categoryStyle[scan.category] || 'bg-surface-container text-on-surface-variant'}`}
                >
                  {scan.category}
                </span>
                <button
                  onClick={() => handleDelete(scan.id)}
                  className="flex-shrink-0 rounded-xl p-2 text-red-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
