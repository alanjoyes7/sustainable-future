import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../database/firebase';
import { Leaf, Recycle, Flame, Trash2, Search, Filter, ScanLine } from 'lucide-react';
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
  const [scanDocs, setScanDocs] = useState<any[]>([]);

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
      const q = query(collection(db, 'scans'), where('uid', '==', currentUser.uid), orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      setScanDocs(snap.docs);
      setScans(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
      setScans(getLocalScans(currentUser.uid));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchScans(); }, [currentUser]);

  const handleDelete = async (scanId: string) => {
    if (!db) {
      deleteLocalScan(scanId);
      setScans(prev => prev.filter(s => s.id !== scanId));
      toast.success('Scan deleted');
      return;
    }

    try {
      await deleteDoc(doc(db, 'scans', scanId));
      setScans(prev => prev.filter(s => s.id !== scanId));
      toast.success('Scan deleted');
    } catch {
      deleteLocalScan(scanId);
      setScans(prev => prev.filter(s => s.id !== scanId));
      toast.success('Scan deleted locally');
    }
  };

  const filteredScans = scans
    .filter(s => filterCategory === 'All' || s.category === filterCategory)
    .filter(s => !search || s.item?.toLowerCase().includes(search.toLowerCase()));

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
      className="max-w-3xl mx-auto space-y-8"
    >
      <section>
        <h1 className="text-4xl font-extrabold text-on-surface mb-2">Scan History</h1>
        <p className="text-on-surface-variant font-medium">All your classified waste items</p>
      </section>

      {/* Search + Filter */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search your scans..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-outline-variant/10 font-medium text-on-surface outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-full font-bold text-xs transition-all active:scale-95 ${
                filterCategory === cat ? 'bg-primary text-white shadow-md' : 'bg-white text-green-900 border border-outline-variant/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 text-center border border-outline-variant/10 shadow-sm">
          <p className="text-2xl font-extrabold text-primary">{scans.length}</p>
          <p className="text-xs text-on-surface-variant font-bold mt-1">Total Scans</p>
        </div>
        <div className="bg-white rounded-2xl p-4 text-center border border-outline-variant/10 shadow-sm">
          <p className="text-2xl font-extrabold text-blue-600">{scans.filter(s => s.category === 'Recyclable').length}</p>
          <p className="text-xs text-on-surface-variant font-bold mt-1">Recyclable</p>
        </div>
        <div className="bg-white rounded-2xl p-4 text-center border border-outline-variant/10 shadow-sm">
          <p className="text-2xl font-extrabold text-green-600">{scans.filter(s => s.category === 'Organic').length}</p>
          <p className="text-xs text-on-surface-variant font-bold mt-1">Organic</p>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-20 text-on-surface-variant">Loading history...</div>
      ) : filteredScans.length === 0 ? (
        <div className="text-center py-20 bg-surface-container-low rounded-[2rem] border border-outline-variant/10">
          <ScanLine className="w-14 h-14 text-on-surface-variant mx-auto mb-4" />
          <h3 className="font-extrabold text-xl text-on-surface mb-2">No scans found</h3>
          <p className="text-on-surface-variant mb-6">Try a different filter or start scanning waste!</p>
          <button
            onClick={() => navigate('/scanner')}
            className="px-8 py-3 bg-primary text-white rounded-full font-bold text-sm shadow-md active:scale-95 transition-transform"
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
                className="flex items-center gap-4 bg-white p-5 rounded-[1.5rem] border border-outline-variant/10 shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Leaf className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-on-surface truncate">{scan.item}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {new Date(scan.timestamp).toLocaleString()} · {scan.inputMethod === 'camera' ? '📸 Camera' : scan.inputMethod === 'image' ? '🖼️ Upload' : '✏️ Text'}
                  </p>
                </div>
                <span className={`hidden sm:inline-flex px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex-shrink-0 ${categoryStyle[scan.category] || 'bg-surface-container text-on-surface-variant'}`}>
                  {scan.category}
                </span>
                <button
                  onClick={() => handleDelete(scan.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-xl hover:bg-red-50 text-red-500 transition-all flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
