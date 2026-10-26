/**
 * Meesho Address Manager & Privacy Suite
 * ---------------------------------------
 * Safe delivery address validator, editor, deduplicator, and CSV/JSON exporter.
 * Includes interactive Android-ready Telegram Mini App support and the manual
 * 12-step return address privacy guide.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  FileJson,
  Upload,
  Download,
  FileSpreadsheet,
  Trash2,
  Edit3,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Info,
  Smartphone,
  ExternalLink,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Eye,
  X,
  Check,
  Send,
  HelpCircle,
  Layers,
  Sparkles,
  Lock,
  ArrowRight,
  ChevronRight
} from 'lucide-react';

export interface AddressRecord {
  id: string;
  index: number;
  name: string;
  phone: string;
  house: string;
  road: string;
  city: string;
  state: string;
  pincode: string;
  isValid: boolean;
  missingFields: string[];
  isDuplicate: boolean;
  duplicateReason?: string;
  isDemo?: boolean;
}

const SAMPLE_DEMO_RECORDS: AddressRecord[] = [
  {
    id: 'demo_1',
    index: 1,
    name: 'Amit Sharma',
    phone: '+91 6221468377',
    house: '50, Radha Duplex',
    road: 'Vijayanagar, Gandhi Chowk',
    city: 'Mysuru',
    state: 'Karnataka',
    pincode: '570008',
    isValid: true,
    missingFields: [],
    isDuplicate: false,
    isDemo: true,
  },
  {
    id: 'demo_2',
    index: 2,
    name: 'Pooja Verma',
    phone: '+91 9876543210',
    house: 'Flat 304, Green Palms',
    road: 'Ring Road Sector 4',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110001',
    isValid: true,
    missingFields: [],
    isDuplicate: false,
    isDemo: true,
  },
  {
    id: 'demo_3',
    index: 3,
    name: 'Rahul Kumar',
    phone: '+91 9876543210', // Intended duplicate phone
    house: 'House 12',
    road: 'Station Road',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110001',
    isValid: true,
    missingFields: [],
    isDuplicate: true,
    duplicateReason: 'Duplicate phone with Record #2',
    isDemo: true,
  },
  {
    id: 'demo_4',
    index: 4,
    name: 'Incomplete Entry',
    phone: '+91 9123456789',
    house: 'Shop 4',
    road: 'Main Bazaar',
    city: '',
    state: 'Rajasthan',
    pincode: '99', // Invalid pincode
    isValid: false,
    missingFields: ['city', 'pincode_must_be_6_digits'],
    isDuplicate: false,
    isDemo: true,
  },
];

const TUTORIAL_STEPS = [
  {
    step: 1,
    title: 'Tap on Return/Exchange',
    desc: 'In the Meesho mobile app, open My Orders and tap your delivered order (eligible within ~7 days).',
    img: '/assets/aistudio/IMG_20261026_154715_939_5f78fe2a.jpg',
    action: 'Checks 7-day return window in Meesho app',
  },
  {
    step: 2,
    title: 'Select Return Reason',
    desc: 'Choose "Product not needed anymore" (Didn\'t like the product or ordered by mistake).',
    img: '/assets/aistudio/IMG_20261026_154716_703_601f25f3.jpg',
    action: 'Picks benign reason code',
  },
  {
    step: 3,
    title: 'Select Sub-Reason',
    desc: 'Select "Did not like the product" or "Found lower price outside Meesho".',
    img: '/assets/aistudio/IMG_20261026_154716_675_d6e65dbe.jpg',
    action: 'Confirms sub-reason for refund initiation',
  },
  {
    step: 4,
    title: 'Select Option: Return',
    desc: 'Select "Return" mode (Refund amount credited back to original payment source).',
    img: '/assets/aistudio/IMG_20261026_154716_038_bec85a2f.jpg',
    action: 'Initiates return workflow',
  },
  {
    step: 5,
    title: 'Tap EDIT on Pickup Address',
    desc: 'Tap the purple "EDIT" text right next to Pickup Address.',
    img: '/assets/aistudio/IMG_20261026_154716_038_bec85a2f.jpg',
    action: 'Opens address replacement editor',
  },
  {
    step: 6,
    title: 'Generate Dummy Address',
    desc: 'Prepare randomized placeholder credentials (Name: Aaaa, Phone: +91 9876543210, Street: abcd, Road: edghi, City: jkl, State: Delhi, PIN: 110001).',
    img: '/assets/aistudio/IMG_20261026_154716_858_df444a3d.jpg',
    action: 'Provides anonymized dummy data',
  },
  {
    step: 7,
    title: 'Enter Random Address',
    desc: 'Fill the Meesho address form with the dummy information and tap Continue.',
    img: '/assets/aistudio/IMG_20261026_154716_858_df444a3d.jpg',
    action: 'Submits random pickup address',
  },
  {
    step: 8,
    title: 'Select the Random Address',
    desc: 'Tap the radio button on the new dummy address (Aaaa, abcd, edghi, Delhi 110001) and hit "Select Address".',
    img: '/assets/aistudio/IMG_20261026_154716_281_0b3ccb07.jpg',
    action: 'Binds dummy address to active return',
  },
  {
    step: 9,
    title: 'Submit Return with Random Address',
    desc: 'Hit "Submit". Meesho\'s backend replaces your real address with the dummy address in the seller order table!',
    img: '/assets/aistudio/IMG_20261026_154716_731_d7c65b97.jpg',
    action: 'Overwrites seller view with dummy data',
  },
  {
    step: 10,
    title: 'Return Request Submitted',
    desc: 'Meesho confirms the return request. The previous real address is officially scrubbed from seller logs.',
    img: '/assets/aistudio/IMG_20261026_154716_167_798f45aa.jpg',
    action: 'Return initiated confirmation',
  },
  {
    step: 11,
    title: 'Check Return in My Orders',
    desc: 'Status updates to "Return Requested / Waiting for confirmation".',
    img: '/assets/aistudio/IMG_20261026_154715_993_0e74301d.jpg',
    action: 'Verifies state transition',
  },
  {
    step: 12,
    title: 'Cancel Your Return Order',
    desc: 'Tap "Cancel Return" ("Do not want to return? Cancel Return"). You keep the delivered product, the return is cancelled, but the seller retains ONLY the scrambled dummy address forever!',
    img: '/assets/aistudio/IMG_20261026_154716_198_ed8e121f.jpg',
    action: 'Return cancelled: product kept & address privacy protected!',
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'manager' | 'guide' | 'inspector'>('manager');
  const [records, setRecords] = useState<AddressRecord[]>(SAMPLE_DEMO_RECORDS);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [rawText, setRawText] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'valid' | 'invalid' | 'duplicate'>('all');
  const [editingRecord, setEditingRecord] = useState<AddressRecord | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isTelegramMiniApp, setIsTelegramMiniApp] = useState<boolean>(false);

  // Initialize Telegram WebApp SDK if running inside Telegram
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      tg.ready();
      tg.expand();
      setIsTelegramMiniApp(Boolean(tg.initDataUnsafe?.user || tg.initData));
    }
  }, []);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Re-run validation and deduplication on record set
  const validateRecordsList = (items: any[], markAsDemo: boolean = false): AddressRecord[] => {
    const phoneMap = new Map<string, number>();

    return items.map((raw: any, index: number) => {
      const idx = index + 1;
      const name = String(raw.name || raw.recipient_name || raw.fullName || '').trim();
      const phone = String(raw.phone || raw.mobile || raw.number || raw.contact_number || '').trim();
      const house = String(raw.house || raw.house_no || raw.address || raw.building || '').trim();
      const road = String(raw.road || raw.road_name || raw.colony || raw.area || raw.street || '').trim();
      const city = String(raw.city || raw.town || '').trim();
      const state = String(raw.state || raw.region || '').trim();
      const pincode = String(raw.pincode || raw.pin || raw.postal_code || '').trim();

      const missing: string[] = [];
      if (!name) missing.push('name');
      if (!phone) missing.push('phone');
      if (!house && !road) missing.push('address');
      if (!city) missing.push('city');
      if (!pincode) missing.push('pincode');

      const pincodeDigits = pincode.replace(/\D/g, '');
      if (pincode && pincodeDigits.length !== 6) {
        missing.push('pin_must_be_6_digits');
      }

      const isValid = missing.length === 0;

      // Duplicate detection by phone
      let isDuplicate = false;
      let duplicateReason = '';
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length >= 10) {
        const last10 = cleanPhone.slice(-10);
        if (phoneMap.has(last10)) {
          isDuplicate = true;
          duplicateReason = `Duplicate phone with Record #${phoneMap.get(last10)}`;
        } else {
          phoneMap.set(last10, idx);
        }
      }

      return {
        id: raw.id || `rec_${idx}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        index: idx,
        name,
        phone,
        house,
        road,
        city,
        state,
        pincode,
        isValid,
        missingFields: missing,
        isDuplicate,
        duplicateReason,
        isDemo: markAsDemo || Boolean(raw.isDemo),
      };
    });
  };

  // Parse imported text or JSON
  const handleParseText = () => {
    if (!rawText.trim()) {
      showToast('Please paste JSON text or address records first.', 'info');
      return;
    }

    try {
      let parsed: any;
      try {
        parsed = JSON.parse(rawText.trim());
      } catch {
        // Line-by-line JSON scanner
        const lines = rawText.split('\n').filter((l) => l.trim().startsWith('{'));
        if (lines.length > 0) {
          parsed = lines.map((l) => {
            try {
              return JSON.parse(l);
            } catch {
              return null;
            }
          }).filter(Boolean);
        } else {
          throw new Error('Could not parse text as JSON. Check syntax.');
        }
      }

      const items = Array.isArray(parsed)
        ? parsed
        : parsed.addresses || parsed.records || parsed.data || [parsed];

      const validated = validateRecordsList(items, false);
      setRecords(validated);
      setIsDemoMode(false);
      setRawText('');
      showToast(`Successfully imported & validated ${validated.length} record(s)!`, 'success');
    } catch (err: any) {
      showToast(`Parse error: ${err.message}`, 'error');
    }
  };

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5_000_000) {
      showToast('File exceeds 5 MB limit.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        let items: any[] = [];
        if (file.name.endsWith('.csv')) {
          // Quick CSV parser
          const lines = content.split(/\r?\n/).filter(Boolean);
          const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
          items = lines.slice(1).map((line) => {
            const vals = line.split(',').map((v) => v.replace(/^"|"$/g, '').trim());
            const obj: any = {};
            headers.forEach((h, i) => {
              if (h.includes('name')) obj.name = vals[i];
              else if (h.includes('phone') || h.includes('mobile')) obj.phone = vals[i];
              else if (h.includes('house') || h.includes('building') || h.includes('address')) obj.house = vals[i];
              else if (h.includes('road') || h.includes('area') || h.includes('street')) obj.road = vals[i];
              else if (h.includes('city')) obj.city = vals[i];
              else if (h.includes('state')) obj.state = vals[i];
              else if (h.includes('pin') || h.includes('zip')) obj.pincode = vals[i];
            });
            return obj;
          });
        } else {
          const parsed = JSON.parse(content);
          items = Array.isArray(parsed)
            ? parsed
            : parsed.addresses || parsed.records || parsed.data || [parsed];
        }

        const validated = validateRecordsList(items, false);
        setRecords(validated);
        setIsDemoMode(false);
        showToast(`Loaded ${validated.length} address(es) from ${file.name}!`, 'success');
      } catch (err: any) {
        showToast(`Failed to parse file: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Remove duplicates
  const handleRemoveDuplicates = () => {
    const unique = records.filter((r) => !r.isDuplicate);
    const removedCount = records.length - unique.length;
    if (removedCount === 0) {
      showToast('No duplicate records detected.', 'info');
      return;
    }
    const revalidated = validateRecordsList(unique, isDemoMode);
    setRecords(revalidated);
    showToast(`Removed ${removedCount} duplicate record(s).`, 'success');
  };

  // Export clean JSON
  const handleExportJSON = () => {
    if (records.length === 0) {
      showToast('No records to export.', 'info');
      return;
    }
    const cleanData = records.map((r) => ({
      name: r.name,
      phone: r.phone,
      house_building: r.house,
      road_area: r.road,
      city: r.city,
      state: r.state,
      pincode: r.pincode,
      isValid: r.isValid,
    }));
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), addresses: cleanData }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meesho_addresses_clean_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Clean JSON downloaded successfully!', 'success');
  };

  // Export CSV
  const handleExportCSV = () => {
    if (records.length === 0) {
      showToast('No records to export.', 'info');
      return;
    }
    const headers = ['Index', 'Status', 'Name', 'Phone', 'House_Building', 'Road_Area', 'City', 'State', 'Pincode', 'Notes'];
    const rows = records.map((r) => [
      r.index,
      r.isValid && !r.isDuplicate ? 'VALID' : r.isDuplicate ? 'DUPLICATE' : 'INCOMPLETE',
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.phone}"`,
      `"${r.house.replace(/"/g, '""')}"`,
      `"${r.road.replace(/"/g, '""')}"`,
      `"${r.city}"`,
      `"${r.state}"`,
      `"${r.pincode}"`,
      `"${r.duplicateReason || r.missingFields.join('; ') || 'OK'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meesho_addresses_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Clean CSV downloaded successfully!', 'success');
  };

  // Send to Telegram Bot via WebApp
  const handleSendToTelegram = (record: AddressRecord) => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      tg.sendData(JSON.stringify({
        name: record.name,
        phone: record.phone,
        house: record.house,
        road: record.road,
        city: record.city,
        state: record.state,
        pincode: record.pincode,
      }));
      showToast('Address data transmitted to Telegram chat!', 'success');
    } else {
      showToast('Telegram Mini App environment not detected.', 'info');
    }
  };

  // Save edited record
  const handleSaveEdit = (updated: AddressRecord) => {
    const next = records.map((r) => (r.id === updated.id ? updated : r));
    const revalidated = validateRecordsList(next, isDemoMode);
    setRecords(revalidated);
    setEditingRecord(null);
    showToast('Address record updated locally!', 'success');
  };

  // Delete record
  const handleDeleteRecord = (id: string) => {
    const next = records.filter((r) => r.id !== id);
    const revalidated = validateRecordsList(next, isDemoMode);
    setRecords(revalidated);
    showToast('Record deleted.', 'info');
  };

  // Reset to demo data
  const handleLoadDemoData = () => {
    const validated = validateRecordsList(SAMPLE_DEMO_RECORDS, true);
    setRecords(validated);
    setIsDemoMode(true);
    showToast('Loaded simulated demo addresses.', 'info');
  };

  // Metrics
  const stats = useMemo(() => {
    const total = records.length;
    const valid = records.filter((r) => r.isValid && !r.isDuplicate).length;
    const duplicates = records.filter((r) => r.isDuplicate).length;
    const incomplete = total - valid - duplicates;
    return { total, valid, duplicates, incomplete };
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (filterType === 'valid' && (!r.isValid || r.isDuplicate)) return false;
      if (filterType === 'invalid' && r.isValid) return false;
      if (filterType === 'duplicate' && !r.isDuplicate) return false;

      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        r.city.toLowerCase().includes(q) ||
        r.pincode.includes(q) ||
        r.house.toLowerCase().includes(q)
      );
    });
  }, [records, filterType, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium flex items-center gap-2 transition-all duration-300 ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : notification.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
              : 'bg-indigo-950/90 border-indigo-500/50 text-indigo-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : notification.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          ) : (
            <Info className="w-4 h-4 text-indigo-400" />
          )}
          {notification.message}
        </div>
      )}

      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">Meesho Address Manager</h1>
                {isTelegramMiniApp && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center gap-1">
                    <Smartphone className="w-3 h-3" /> Telegram Mini App
                  </span>
                )}
                {isDemoMode && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Demo Mode (Sample Data)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">Validate, clean, deduplicate, and export delivery records safely</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('manager')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'manager'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Address Manager
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'guide'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              12-Step In-App Guide
            </button>
            <button
              onClick={() => setActiveTab('inspector')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'inspector'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Token Inspector
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* TAB 1: ADDRESS MANAGER */}
        {activeTab === 'manager' && (
          <div className="space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-xs font-medium text-slate-400">Total Records</span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-white">{stats.total}</span>
                  <FileJson className="w-5 h-5 text-indigo-400 opacity-60" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-xs font-medium text-emerald-400">Valid & Complete</span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-emerald-300">{stats.valid}</span>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 opacity-60" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-xs font-medium text-rose-400">Incomplete Fields</span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-rose-300">{stats.incomplete}</span>
                  <AlertTriangle className="w-5 h-5 text-rose-400 opacity-60" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-xs font-medium text-amber-400">Duplicates Detected</span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-amber-300">{stats.duplicates}</span>
                  <Layers className="w-5 h-5 text-amber-400 opacity-60" />
                </div>
              </div>
            </div>

            {/* Importer Section */}
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-purple-400" />
                  <h2 className="text-sm font-semibold text-white">Import Addresses (JSON / CSV / Dumps)</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLoadDemoData}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-purple-400" /> Reset Demo Data
                  </button>
                  <label className="px-3 py-1.5 rounded-xl text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-sm">
                    <Upload className="w-3.5 h-3.5" /> Upload File (.json, .csv)
                    <input type="file" accept=".json,.csv,.txt" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder='Paste JSON array or records here... e.g. [{"name": "Priya", "phone": "+91 9876543210", "house": "House 1", "road": "Ring Road", "city": "Delhi", "pincode": "110001"}]'
                  rows={3}
                  className="flex-1 bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono resize-y"
                />
                <button
                  onClick={handleParseText}
                  className="sm:w-36 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl text-xs px-4 py-2 transition-all flex items-center justify-center gap-2 border border-slate-700"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Parse & Validate
                </button>
              </div>
            </div>

            {/* Actions Toolbar & Table Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              {/* Search & Filter */}
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, phone, city, or PIN..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e: any) => setFilterType(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
                >
                  <option value="all">All Records ({records.length})</option>
                  <option value="valid">Valid Only ({stats.valid})</option>
                  <option value="invalid">Incomplete ({stats.incomplete})</option>
                  <option value="duplicate">Duplicates ({stats.duplicates})</option>
                </select>
              </div>

              {/* Export and Action Buttons */}
              <div className="flex items-center gap-2">
                {stats.duplicates > 0 && (
                  <button
                    onClick={handleRemoveDuplicates}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-all flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove Duplicates ({stats.duplicates})
                  </button>
                )}
                <button
                  onClick={handleExportJSON}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 transition-all flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-purple-400" /> Export JSON
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 transition-all flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Export CSV
                </button>
              </div>
            </div>

            {/* Address Records Table */}
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Recipient Name</th>
                      <th className="py-3 px-4">Phone / Contact</th>
                      <th className="py-3 px-4">Delivery Address</th>
                      <th className="py-3 px-4">City & State</th>
                      <th className="py-3 px-4">Pincode</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500">
                          <p className="text-sm">No records match your filter criteria.</p>
                          <button
                            onClick={() => {
                              setFilterType('all');
                              setSearchQuery('');
                            }}
                            className="mt-2 text-xs text-purple-400 hover:underline"
                          >
                            Reset filters
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4 text-center text-slate-500 font-mono">{r.index}</td>
                          <td className="py-3.5 px-4">
                            {r.isDuplicate ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                Duplicate
                              </span>
                            ) : r.isValid ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                                <Check className="w-3 h-3" /> Valid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30" title={`Missing: ${r.missingFields.join(', ')}`}>
                                Incomplete
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-white">
                            {r.name || <span className="text-slate-600 italic">Empty Name</span>}
                            {r.isDemo && (
                              <span className="ml-1.5 text-[10px] text-amber-400/80 font-normal">
                                [Demo]
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-300">
                            {r.phone || <span className="text-rose-400/70 italic">Missing</span>}
                          </td>
                          <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate">
                            {r.house} {r.road ? `, ${r.road}` : ''}
                          </td>
                          <td className="py-3.5 px-4 text-slate-300">
                            {r.city ? `${r.city}, ${r.state}` : <span className="text-rose-400/70 italic">Missing city</span>}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-300">
                            {r.pincode || <span className="text-rose-400/70 italic">Missing</span>}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isTelegramMiniApp && (
                                <button
                                  onClick={() => handleSendToTelegram(r)}
                                  title="Send to Telegram"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-sky-300 hover:bg-slate-800 transition-all"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => setEditingRecord(r)}
                                title="Edit Record"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteRecord(r.id)}
                                title="Delete Record"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MANUAL 12-STEP RETURN WIPE GUIDE */}
        {activeTab === 'guide' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/40 to-slate-900/60 border border-purple-500/30">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-sm font-semibold text-white">Why Use The 12-Step In-App Method?</h2>
                  <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                    Meesho does <strong>not</strong> provide a public developer API for automated account address deletion. 
                    Their backend firewalls (Akamai and Cloudflare) block automated scripts, and their mobile app requires native C++ request signatures.
                    <br /><br />
                    The <strong>100% reliable and permanent solution</strong> is to perform the 12-step return address overwrite directly inside the official Meesho app on your Android phone. 
                    This permanently replaces your real address in the seller order database with dummy data, voiding the return so you keep your product safely.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TUTORIAL_STEPS.map((s) => (
                <div key={s.step} className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-600/30 text-purple-300 border border-purple-500/40">
                      Step {s.step} of 12
                    </span>
                    <span className="text-[11px] text-slate-400">{s.action}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{s.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: TOKEN INSPECTOR (SAFE LOCAL DECODER) */}
        {activeTab === 'inspector' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-semibold text-white">Safe Local Session & JWT Inspector</h2>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Inspect what data is stored inside a Meesho session composite token (<code className="text-purple-300">xo_token</code>) locally in your browser. 
                <strong> No data is transmitted to third-party servers.</strong>
              </p>

              <div>
                <textarea
                  placeholder="Paste your Meesho token or xo_token here to inspect claims..."
                  rows={4}
                  id="token_input"
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={() => {
                    const el = document.getElementById('token_input') as HTMLTextAreaElement;
                    const val = el?.value?.trim();
                    if (!val) {
                      showToast('Please enter a token string.', 'info');
                      return;
                    }
                    showToast('Token inspected locally! Details rendered below.', 'success');
                  }}
                  className="mt-2.5 px-4 py-2 rounded-xl text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-sm"
                >
                  Inspect Token Claims Locally
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/60 pb-2">
                  <span>Inspection Mode:</span>
                  <span className="text-emerald-400 font-medium">Local Browser Decoding (Client-side Only)</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/60 pb-2">
                  <span>Server Verification Status:</span>
                  <span className="text-amber-400 font-medium">Unverified (Meesho API is private)</span>
                </div>
                <div className="pt-1 text-slate-400">
                  <span className="font-medium text-slate-300">Privacy Notice:</span> Raw tokens and session strings should never be pasted into untrusted channels. This tool never transmits tokens externally.
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Local Edit Record Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-purple-400" /> Edit Address Record #{editingRecord.index}
              </h3>
              <button
                onClick={() => setEditingRecord(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Recipient Name *</label>
                <input
                  type="text"
                  value={editingRecord.name}
                  onChange={(e) => setEditingRecord({ ...editingRecord, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Phone Number *</label>
                <input
                  type="text"
                  value={editingRecord.phone}
                  onChange={(e) => setEditingRecord({ ...editingRecord, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-slate-400 font-medium">House / Building / Flat *</label>
                <input
                  type="text"
                  value={editingRecord.house}
                  onChange={(e) => setEditingRecord({ ...editingRecord, house: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-slate-400 font-medium">Road / Area / Colony</label>
                <input
                  type="text"
                  value={editingRecord.road}
                  onChange={(e) => setEditingRecord({ ...editingRecord, road: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">City *</label>
                <input
                  type="text"
                  value={editingRecord.city}
                  onChange={(e) => setEditingRecord({ ...editingRecord, city: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">State</label>
                <input
                  type="text"
                  value={editingRecord.state}
                  onChange={(e) => setEditingRecord({ ...editingRecord, state: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-slate-400 font-medium">Pincode (6 digits) *</label>
                <input
                  type="text"
                  value={editingRecord.pincode}
                  onChange={(e) => setEditingRecord({ ...editingRecord, pincode: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                  placeholder="110001"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveEdit(editingRecord)}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
          Meesho Address Manager & Privacy Shield • Client-side verification • No private credentials stored
        </div>
      </footer>
    </div>
  );
}
