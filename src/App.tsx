/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Play,
  RotateCcw,
  Upload,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Terminal,
  Smartphone,
  Copy,
  Check,
  RefreshCw,
  Eye,
  Sliders,
  Sparkles,
  Lock,
  Package,
  Layers,
  ArrowRight,
  HelpCircle,
  Download,
  Star,
  CheckSquare,
  SmartphoneNfc,
  ClipboardPaste,
  Users,
  FileText,
  FileCode,
  ListFilter,
  Trash2,
  Timer
} from 'lucide-react';

interface Order {
  orderId: string;
  title: string;
  status: string;
  deliveredDate: string;
  returnAvailableTill: string;
  returnEligible: boolean;
  amount: string;
  image: string;
  currentAddress: {
    name: string;
    number: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  addressProtected: boolean;
  returnStatus: string;
}

interface DummyAddress {
  name: string;
  number: string;
  address: string;
  road: string;
  pincode: string;
  city: string;
  state: string;
  fullAddress?: string;
}

interface AuditLog {
  step: number;
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'running' | 'info';
  details?: any;
}

interface BulkAccount {
  id: string;
  index: number;
  name: string;
  phone: string;
  userId: string;
  instance_id?: string;
  token: string;
  tokenSnippet: string;
  cookies?: string;
  raw: any;
  status: 'ready' | 'running' | 'retrying' | 'protected' | 'failed';
  currentStep?: number;
  retryAttempt?: number;
  retryCountdownSec?: number;
  retrySuccess?: boolean;
  ordersCount: number;
  isDuplicate?: boolean;
  duplicateReason?: string;
  beforeAddress?: any;
  afterAddress?: any;
  logs?: any[];
}

const TUTORIAL_STEPS = [
  {
    step: 1,
    title: 'Tap on Return/Exchange',
    desc: 'Open order details for any delivered product within the return window. Meesho keeps the button active for ~7 days.',
    img: '/public/assets/aistudio/IMG_20261026_154715_939_5f78fe2a.jpg',
    actionText: 'Checks return window and initiates return process',
  },
  {
    step: 2,
    title: 'Select Return Reason',
    desc: 'Select "Product not needed anymore" or any reason from the list.',
    img: '/public/assets/aistudio/IMG_20261026_154716_703_601f25f3.jpg',
    actionText: 'Chooses non-damaging return reason',
  },
  {
    step: 3,
    title: 'Select Sub-Reason',
    desc: 'Pick "Did not like the product" or "Found lower price outside Meesho".',
    img: '/public/assets/aistudio/IMG_20261026_154716_675_d6e65dbe.jpg',
    actionText: 'Confirms sub-reason for refund initiation',
  },
  {
    step: 4,
    title: 'Select Return & Tap EDIT',
    desc: 'Choose "Return" mode, then tap "EDIT" right next to Pickup Address.',
    img: '/public/assets/aistudio/IMG_20261026_154716_038_bec85a2f.jpg',
    actionText: 'Opens pickup address change modal',
  },
  {
    step: 7,
    title: 'Enter Random Address',
    desc: 'Input dummy random credentials (Name: Aaaa, Phone: +91 9876543210, Address: abcd, edghi).',
    img: '/public/assets/aistudio/IMG_20261026_154716_858_df444a3d.jpg',
    actionText: 'Fills form with dummy placeholder info',
  },
  {
    step: 8,
    title: 'Select Random Address',
    desc: 'Pick the newly generated dummy address as the active pickup address.',
    img: '/public/assets/aistudio/IMG_20261026_154716_281_0b3ccb07.jpg',
    actionText: 'Sets dummy address as default return address',
  },
  {
    step: 9,
    title: 'Submit Return with Random Address',
    desc: 'Submit return request. Meesho backend overwrites the order shipping/pickup address with the dummy address!',
    img: '/public/assets/aistudio/IMG_20261026_154716_731_d7c65b97.jpg',
    actionText: 'Forces database overwrite of seller address records',
  },
  {
    step: 10,
    title: 'Return Initiated',
    desc: 'Return request is confirmed by Meesho. Real address is officially scrubbed from the order table.',
    img: '/public/assets/aistudio/IMG_20261026_154716_167_798f45aa.jpg',
    actionText: 'Meesho issues confirmation with scrambled address',
  },
  {
    step: 11,
    title: 'Check Return in My Orders',
    desc: 'Order appears as "Return Requested / Waiting for confirmation".',
    img: '/public/assets/aistudio/IMG_20261026_154715_993_0e74301d.jpg',
    actionText: 'Verifies state transition in customer account',
  },
  {
    step: 12,
    title: 'Cancel Return Order',
    desc: 'Hit "Cancel Return". Order status reverts to Delivered/Kept, but the seller ONLY sees the dummy address forever!',
    img: '/public/assets/aistudio/IMG_20261026_154716_198_ed8e121f.jpg',
    actionText: 'Cancels return: Product kept, privacy protected forever',
  },
];

const DEFAULT_SAMPLE_JSON = JSON.stringify(
  {
    phone: "+918583926134",
    user_id: "592370847",
    xo_token: "eyJ0eXBlIjoiY29tcG9zaXRlIn0=.eyJqd3QiOiJleUpoYkdjaU9pSklVekkxTmlJc0ltaDBkSEJ6T2k4dmJXVmxjMmh2TG1OdmJTOXBjMjlmWTI5MWJuUnllVjlqYjJSbElqb2lTVTRpTENKb2RIUndjem92TDIxbFpYTm9ieTVqYjIwdmRtVnljMmx2YmlJNklqRWlMQ0owZVhBaU9pSktWMVFpZlEuZXlKbGVIQWlPakUzT1RNd09UYzRNekVzSW1oMGRIQnpPaTh2YldWbGMyaHZMbU52YlM5cGJuTjBZVzVqWlY5cFpDSTZJbVZtTVRGa01tRTVZV016WkRSa1lqVTRNRGRoWlRBNU9UZGtNakV5WkRBeklpd2lhSFIwY0hNNkx5OXRaV1Z6YUc4dVkyOXRMM1Z6WlhKZmFXUWlPaUkxT1RJek56QTRORGNpTENKcFlYUWlPakUzT1RJNU1qVXdNekY5LjZkOVNoV3B1VkE4eUNBWVZlNXBPZXpleHA0TUQwcWNtLXhBX0pDV2lDSnciLCJ4byI6IjJiY2FmMDY0ZGVkNDQ0N2M4N2IyNzVkODg2YWM0ZDFkIn0=",
    ox_token: "Mxc7ZjqD1OIpo206chOEIxQYbNsMHsuyP65oU9MN19GbuLK59TLvLoEOxe187DOp1rvCl1JcwBgrv0pNsMLtouuT8mCfPWBRDlnBBXICH3XISKWroaPVwJyIMBwwROnhv8TaJA",
    instance_id: "ef11d2a9ac3d4db5807ae0997d212d03",
    otpless_token: "65584656ffbd44a3aa5f1edaa3e93cb8",
    new_account: true
  },
  null,
  2
);

const DEFAULT_SAMPLE_BULK_TXT = `// Account 1: Primary Account (+918583926134)
{"phone":"+918583926134","user_id":"592370847","xo_token":"eyJ0eXBlIjoiY29tcG9zaXRlIn0=.eyJqd3QiOiJleUpoYkdjaU9pSklVekkxTmlJc0ltaDBkSEJ6T2k4dmJXVmxjMmh2TG1OdmJTOXBjMjlmWTI5MWJuUnllVjlqYjJSbElqb2lTVTRpTENKb2RIUndjem92TDIxbFpYTm9ieTVqYjIwdmRtVnljMmx2YmlJNklqRWlMQ0owZVhBaU9pSktWMVFpZlEuZXlKbGVIQWlPakUzT1RNd09UYzRNekVzSW1oMGRIQnpPaTh2YldWbGMyaHZMbU52YlM5cGJuTjBZVzVqWlY5cFpDSTZJbVZtTVRGa01tRTVZV016WkRSa1lqVTRNRGRoWlRBNU9UZGtNakV5WkRBeklpd2lhSFIwY0hNNkx5OXRaV1Z6YUc4dVkyOXRMM1Z6WlhKZmFXUWlPaUkxT1RJek56QTRORGNpTENKcFlYUWlPakUzT1RJNU1qVXdNekY5LjZkOVNoV3B1VkE4eUNBWVZlNXBPZXpleHA0TUQwcWNtLXhBX0pDV2lDSnciLCJ4byI6IjJiY2FmMDY0ZGVkNDQ0N2M4N2IyNzVkODg2YWM0ZDFkIn0=","ox_token":"Mxc7ZjqD1OIpo206chOEIxQYbNsMHsuyP65oU9MN19GbuLK59TLvLoEOxe187DOp1rvCl1JcwBgrv0pNsMLtouuT8mCfPWBRDlnBBXICH3XISKWroaPVwJyIMBwwROnhv8TaJA","instance_id":"ef11d2a9ac3d4db5807ae0997d212d03"}

// Account 2: Second Account (+919876543211)
{"phone":"+919876543211","user_id":"592370848","xo_token":"eyJ0eXBlIjoiY29tcG9zaXRlIn0=.eyJqd3QiOiJleUpoYkdjaU9pSklVekkxTmlJc0ltaDBkSEJ6T2k4dmJXVmxjMmh2TG1OdmJTOXBjMjlmWTI5MWJuUnllVjlqYjJSbElqb2lTVTRpTENKb2RIUndjem92TDIxbFpYTm9ieTVqYjIwdmRtVnljMmx2YmlJNklqRWlMQ0owZVhBaU9pSktWMVFpZlEuZXlKbGVIQWlPakUzT1RNd09UYzRNekVzSW1oMGRIQnpPaTh2YldWbGMyaHZMbU52YlM5cGJuTjBZVzVqWlY5cFpDSTZJbVZtTVRGa01tRTVZV016WkRSa1lqVTRNRGRoWlRBNU9UZGtNakV5WkRBeklpd2lhSFIwY0hNNkx5OXRaV1Z6YUc4dVkyOXRMM1Z6WlhKZmFXUWlPaUkxT1RJek56QTRORGNpTENKcFlYUWlPakUzT1RJNU1qVXdNekY5LjZkOVNoV3B1VkE4eUNBWVZlNXBPZXpleHA0TUQwcWNtLXhBX0pDV2lDSnciLCJ4byI6IjJiY2FmMDY0ZGVkNDQ0N2M4N2IyNzVkODg2YWM0ZDFkIn0=","ox_token":"Mxc7ZjqD1OIpo206chOEIxQYbNsMHsuyP65oU9MN19GbuLK59TLvLoEOxe187DOp1rvCl1JcwBgrv0pNsMLtouuT8mCfPWBRDlnBBXICH3XISKWroaPVwJyIMBwwROnhv8TaJA","instance_id":"ef11d2a9ac3d4db5807ae0997d212d04"}

// Account 3: Third Account (+919876543212)
{"phone":"+919876543212","user_id":"592370849","xo_token":"eyJ0eXBlIjoiY29tcG9zaXRlIn0=.eyJqd3QiOiJleUpoYkdjaU9pSklVekkxTmlJc0ltaDBkSEJ6T2k4dmJXVmxjMmh2TG1OdmJTOXBjMjlmWTI5MWJuUnllVjlqYjJSbElqb2lTVTRpTENKb2RIUndjem92TDIxbFpYTm9ieTVqYjIwdmRtVnljMmx2YmlJNklqRWlMQ0owZVhBaU9pSktWMVFpZlEuZXlKbGVIQWlPakUzT1RNd09UYzRNekVzSW1oMGRIQnpPaTh2YldWbGMyaHZMbU52YlM5cGJuTjBZVzVqWlY5cFpDSTZJbVZtTVRGa01tRTVZV016WkRSa1lqVTRNRGRoWlRBNU9UZGtNakV5WkRBeklpd2lhSFIwY0hNNkx5OXRaV1Z6YUc4dVkyOXRMM1Z6WlhKZmFXUWlPaUkxT1RJek56QTRORGNpTENKcFlYUWlPakUzT1RJNU1qVXdNekY5LjZkOVNoV3B1VkE4eUNBWVZlNXBPZXpleHA0TUQwcWNtLXhBX0pDV2lDSnciLCJ4byI6IjJiY2FmMDY0ZGVkNDQ0N2M4N2IyNzVkODg2YWM0ZDFkIn0=","ox_token":"Mxc7ZjqD1OIpo206chOEIxQYbNsMHsuyP65oU9MN19GbuLK59TLvLoEOxe187DOp1rvCl1JcwBgrv0pNsMLtouuT8mCfPWBRDlnBBXICH3XISKWroaPVwJyIMBwwROnhv8TaJA","instance_id":"ef11d2a9ac3d4db5807ae0997d212d05"}

// Account 4 (Duplicate Account Demo): Same Phone and Instance ID as Account 1
{"phone":"+918583926134","name":"Duplicate Demo (+918583926134)","user_id":"592370850","xo_token":"eyJ0eXBlIjoiY29tcG9zaXRlIn0=.eyJqd3QiOiJleUpoYkdjaU9pSklVekkxTmlJc0ltaDBkSEJ6T2k4dmJXVmxjMmh2TG1OdmJTOXBjMjlmWTI5MWJuUnllVjlqYjJSbElqb2lTVTRpTENKb2RIUndjem92TDIxbFpYTm9ieTVqYjIwdmRtVnljMmx2YmlJNklqRWlMQ0owZVhBaU9pSktWMVFpZlEuZXlKbGVIQWlPakUzT1RNd09UYzRNekVzSW1oMGRIQnpPaTh2YldWbGMyaHZMbU52YlM5cGJuTjBZVzVqWlY5cFpDSTZJbVZtTVRGa01tRTVZV016WkRSa1lqVTRNRGRoWlRBNU9UZGtNakV5WkRBeklpd2lhSFIwY0hNNkx5OXRaV1Z6YUc4dVkyOXRMM1Z6WlhKZmFXUWlPaUkxT1RJek56QTRORGNpTENKcFlYUWlPakUzT1RJNU1qVXdNekY5LjZkOVNoV3B1VkE4eUNBWVZlNXBPZXpleHA0TUQwcWNtLXhBX0pDV2lDSnciLCJ4byI6IjJiY2FmMDY0ZGVkNDQ0N2M4N2IyNzVkODg2YWM0ZDFkIn0=","ox_token":"Mxc7ZjqD1OIpo206chOEIxQYbNsMHsuyP65oU9MN19GbuLK59TLvLoEOxe187DOp1rvCl1JcwBgrv0pNsMLtouuT8mCfPWBRDlnBBXICH3XISKWroaPVwJyIMBwwROnhv8TaJA","instance_id":"ef11d2a9ac3d4db5807ae0997d212d03"}

// Account 5 (Auto-Retry Demo): Simulated transient network failure to demonstrate 10s countdown & retry
{"phone":"+919876543999","name":"Auto-Retry Demo Account","user_id":"592370855","xo_token":"eyJ0eXBlIjoiY29tcG9zaXRlIn0=.eyJqd3QiOiJleUpoYkdjaU9pSklVekkxTmlJc0ltaDBkSEJ6T2k4dmJXVmxjMmh2TG1OdmJTOXBjMjlmWTI5MWJuUnllVjlqYjJSbElqb2lTVTRpTENKb2RIUndjem92TDIxbFpYTm9ieTVqYjIwdmRtVnljMmx2YmlJNklqRWlMQ0owZVhBaU9pSktWMVFpZlEuZXlKbGVIQWlPakUzT1RNd09UYzRNekVzSW1oMGRIQnpPaTh2YldWbGMyaHZMbU52YlM5cGJuTjBZVzVqWlY5cFpDSTZJbVZtTVRGa01tRTVZV016WkRSa1lqVTRNRGRoWlRBNU9UZGtNakV5WkRBeklpd2lhSFIwY0hNNkx5OXRaV1Z6YUc4dVkyOXRMM1Z6WlhKZmFXUWlPaUkxT1RJek56QTRORGNpTENKcFlYUWlPakUzT1RJNU1qVXdNekY5LjZkOVNoV3B1VkE4eUNBWVZlNXBPZXpleHA0TUQwcWNtLXhBX0pDV2lDSnciLCJ4byI6IjJiY2FmMDY0ZGVkNDQ0N2M4N2IyNzVkODg2YWM0ZDFkIn0=","ox_token":"Mxc7ZjqD1OIpo206chOEIxQYbNsMHsuyP65oU9MN19GbuLK59TLvLoEOxe187DOp1rvCl1JcwBgrv0pNsMLtouuT8mCfPWBRDlnBBXICH3XISKWroaPVwJyIMBwwROnhv8TaJA","instance_id":"ef11d2a9ac3d4db5807ae0997d212d99"}`;

export default function App() {
  const [activeTab, setActiveTab] = useState<'automate' | 'bulk' | 'review' | 'orders' | 'tutorial' | 'python'>('automate');
  
  // Single JSON State
  const [jsonInput, setJsonInput] = useState<string>(DEFAULT_SAMPLE_JSON);
  const [parsedMeta, setParsedMeta] = useState<any>(null);

  // Bulk Multi-JSON / TXT State
  const [bulkInput, setBulkInput] = useState<string>(DEFAULT_SAMPLE_BULK_TXT);
  const [bulkAccounts, setBulkAccounts] = useState<BulkAccount[]>([]);
  const [isBulkParsing, setIsBulkParsing] = useState<boolean>(false);
  const [isBulkProtecting, setIsBulkProtecting] = useState<boolean>(false);
  const [bulkProgress, setBulkProgress] = useState<number>(0);
  const [bulkCurrentIndex, setBulkCurrentIndex] = useState<number>(0);
  const [bulkCompleted, setBulkCompleted] = useState<boolean>(false);
  const [selectedBulkAccount, setSelectedBulkAccount] = useState<BulkAccount | null>(null);

  // User Requested: Auto-Retry Failed & Duplicate Filters
  const [autoRetryFailed, setAutoRetryFailed] = useState<boolean>(true);
  const [filterDuplicatesOnly, setFilterDuplicatesOnly] = useState<boolean>(false);

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('all_eligible');

  // Address Randomizer State
  const [dummyAddress, setDummyAddress] = useState<DummyAddress>({
    name: 'Aaaa',
    number: '+91 9876543210',
    address: 'abcd',
    road: 'edghi',
    pincode: '110001',
    city: 'Delhi',
    state: 'Delhi',
  });
  const [customAddressMode, setCustomAddressMode] = useState<boolean>(false);

  // Automation Execution State
  const [isProtecting, setIsProtecting] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [completedSuccess, setCompletedSuccess] = useState<boolean>(false);

  // Simulator / Review Step Tracker
  const [simStep, setSimStep] = useState<number>(0);

  // UI helpers
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    if (terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [auditLogs]);

  useEffect(() => {
    fetchOrders();
    handleParseJson(jsonInput);
    handleParseBulk(DEFAULT_SAMPLE_BULK_TXT);
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/meesho/orders');
      const data = await res.json();
      if (data.success && data.orders) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  };

  const handleResetOrders = async () => {
    try {
      const res = await fetch('/api/meesho/orders/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
        setCompletedSuccess(false);
        setAuditLogs([]);
        setProgressPercent(0);
        setCurrentStepIndex(0);
        setSimStep(0);
        showToast('Sample order records reset to initial un-protected state.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleParseJson = async (text: string) => {
    try {
      const res = await fetch('/api/meesho/parse-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonText: text }),
      });
      const data = await res.json();
      if (data.success) {
        setParsedMeta(data.data);
      } else {
        setParsedMeta(null);
      }
    } catch {
      setParsedMeta(null);
    }
  };

  // Clipboard Paste Helper for Single JSON
  const handlePasteClipboardSingle = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (!clipText || !clipText.trim()) {
        showToast('Clipboard is empty.');
        return;
      }
      setJsonInput(clipText);
      await handleParseJson(clipText);
      showToast('Pasted JSON from clipboard!');
    } catch {
      showToast('Please grant clipboard permission in your browser.');
    }
  };

  // Clipboard Paste Helper for Bulk JSON / TXT
  const handlePasteClipboardBulk = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (!clipText || !clipText.trim()) {
        showToast('Clipboard is empty.');
        return;
      }
      setBulkInput(clipText);
      await handleParseBulk(clipText);
      showToast('Pasted bulk text from clipboard! Parsed and scanned duplicates.');
    } catch {
      showToast('Please grant clipboard permission in your browser.');
    }
  };

  // Client-side duplicate detection scanner
  const detectDuplicates = (list: BulkAccount[]): BulkAccount[] => {
    const phoneMap = new Map<string, number>();
    const instanceMap = new Map<string, number>();

    return list.map((acc, idx) => {
      let isDuplicate = false;
      const reasons: string[] = [];

      const phone = (acc.phone || '').trim();
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      if (cleanPhone.length >= 10) {
        const last10 = cleanPhone.slice(-10);
        if (phoneMap.has(last10)) {
          isDuplicate = true;
          reasons.push(`Same Phone as Account #${phoneMap.get(last10)}`);
        } else {
          phoneMap.set(last10, idx + 1);
        }
      }

      const instanceId = (acc.instance_id || acc.raw?.instance_id || acc.raw?.instance || '').trim();
      if (instanceId && instanceId.length >= 6) {
        if (instanceMap.has(instanceId)) {
          isDuplicate = true;
          reasons.push(`Same Instance ID as Account #${instanceMap.get(instanceId)}`);
        } else {
          instanceMap.set(instanceId, idx + 1);
        }
      }

      return {
        ...acc,
        isDuplicate: acc.isDuplicate || isDuplicate,
        duplicateReason: acc.duplicateReason || reasons.join(' & '),
      };
    });
  };

  // Parse Bulk JSON / TXT
  const handleParseBulk = async (text: string) => {
    if (!text || !text.trim()) {
      setBulkAccounts([]);
      return;
    }
    setIsBulkParsing(true);
    try {
      const res = await fetch('/api/meesho/parse-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });
      const data = await res.json();
      if (data.success && data.accounts) {
        const checkedList = detectDuplicates(data.accounts);
        setBulkAccounts(checkedList);
      } else {
        setBulkAccounts([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsBulkParsing(false);
    }
  };

  // Remove All Duplicate Accounts Action
  const handleRemoveDuplicates = () => {
    const unique = bulkAccounts.filter((a) => !a.isDuplicate);
    const removedCount = bulkAccounts.length - unique.length;
    const reindexed = unique.map((a, i) => ({
      ...a,
      index: i + 1,
      isDuplicate: false,
      duplicateReason: '',
    }));
    setBulkAccounts(reindexed);
    setFilterDuplicatesOnly(false);
    showToast(`Removed ${removedCount} duplicate account(s)! ${reindexed.length} clean accounts remaining.`);
  };

  // Bulk File Upload handler (.json, .txt, .ndjson)
  const handleBulkFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const readPromises: Promise<string>[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      readPromises.push(
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve((event.target?.result as string) || '');
          reader.readAsText(f);
        })
      );
    }

    Promise.all(readPromises).then((contents) => {
      const combined = contents.join('\n\n');
      setBulkInput(combined);
      handleParseBulk(combined);
      showToast(`Uploaded ${files.length} file(s)! Extracting sessions...`);
    });
  };

  const handleRandomizeAddress = () => {
    const names = ['Aaaa', 'R. K. Verma', 'P. Kumar', 'S. Gupta', 'Amit K.'];
    const streets = ['abcd', 'House 42', 'Block B-101', 'Flat 302'];
    const roads = ['edghi', 'Sector 9 Industrial', 'Ring Road Bypass', 'Old Substation Lane'];
    const cities = [
      { city: 'Delhi', state: 'Delhi', pincode: '110001' },
      { city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
      { city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
      { city: 'Mysuru', state: 'Karnataka', pincode: '570008' },
    ];
    const pickedCity = cities[Math.floor(Math.random() * cities.length)];
    const randPhone = `+91 ${Math.floor(6000000000 + Math.random() * 3999999999)}`;

    setDummyAddress({
      name: names[Math.floor(Math.random() * names.length)],
      number: randPhone,
      address: streets[Math.floor(Math.random() * streets.length)],
      road: roads[Math.floor(Math.random() * roads.length)],
      pincode: pickedCity.pincode,
      city: pickedCity.city,
      state: pickedCity.state,
    });
  };

  // Single Order Automation
  const startAutomation = async () => {
    setIsProtecting(true);
    setCompletedSuccess(false);
    setAuditLogs([]);
    setProgressPercent(0);
    setCurrentStepIndex(0);

    const stepDefinitions = [
      { step: 1, title: '1. Tap on Return/Exchange', desc: 'Querying order history & verifying active return window...' },
      { step: 2, title: '2. Select Return Reason', desc: 'Selecting "Product not needed anymore" category...' },
      { step: 3, title: '3. Select Sub-Reason', desc: 'Selecting sub-reason "Did not like the product"...' },
      { step: 4, title: '4. Select Available Option: Return', desc: 'Selecting "Return" with refund mode Back to Source...' },
      { step: 5, title: '5. Tap EDIT on Pickup Address', desc: 'Opening address editor to scrub exposed customer data...' },
      { step: 6, title: '6. Generate Random Address', desc: `Injecting dummy identity: ${dummyAddress.name}, ${dummyAddress.number}...` },
      { step: 7, title: '7. Enter Random Address', desc: `Filling form: ${dummyAddress.address}, ${dummyAddress.road}, ${dummyAddress.city} (${dummyAddress.pincode})...` },
      { step: 8, title: '8. Select the Random Address', desc: 'Designating random dummy address as default pickup address...' },
      { step: 9, title: '9. Submit Return/Exchange Request', desc: 'Dispatching return order. Meesho database overwrites shipping address!' },
      { step: 10, title: '10. Return/Exchange Initiated', desc: 'Return generated! Real buyer phone & home address wiped from seller view.' },
      { step: 11, title: '11. Check My Orders Status', desc: 'Verifying return request status in customer profile...' },
      { step: 12, title: '12. Now Cancel Your Return Order', desc: 'Executing "Cancel Return". Buyer keeps item, seller retains dummy address forever!' },
    ];

    for (let i = 0; i < stepDefinitions.length; i++) {
      const step = stepDefinitions[i];
      setCurrentStepIndex(step.step);
      setProgressPercent(Math.round(((i + 1) / stepDefinitions.length) * 100));

      setAuditLogs((prev) => [
        ...prev,
        {
          step: step.step,
          title: step.title,
          description: step.desc,
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
          status: 'success',
        },
      ]);

      await new Promise((r) => setTimeout(r, 450));
    }

    try {
      const res = await fetch('/api/meesho/auto-protect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrderId,
          customDummyAddress: dummyAddress,
        }),
      });
      const data = await res.json();
      if (data.success && data.orders) {
        setOrders(data.orders);
        setCompletedSuccess(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProtecting(false);
    }
  };

  // Bulk Multi-Account Automation Runner with Auto-Retry Logic
  const startBulkAutomation = async () => {
    if (bulkAccounts.length === 0) return;
    setIsBulkProtecting(true);
    setBulkCompleted(false);
    setBulkProgress(0);

    const updatedAccounts = [...bulkAccounts];

    for (let i = 0; i < updatedAccounts.length; i++) {
      setBulkCurrentIndex(i + 1);
      const acc = updatedAccounts[i];

      // Run execution sequence with Auto-Retry on failure support
      let success = false;
      let attempt = 1;
      const maxAttempts = autoRetryFailed ? 2 : 1;

      while (!success && attempt <= maxAttempts) {
        if (attempt === 2) {
          // Auto-Retry Triggered: Wait 10 seconds before attempting again
          acc.status = 'retrying';
          acc.retryAttempt = 2;
          for (let sec = 10; sec > 0; sec--) {
            acc.retryCountdownSec = sec;
            setBulkAccounts([...updatedAccounts]);
            await new Promise((r) => setTimeout(r, 1000));
          }
          acc.retryCountdownSec = undefined;
        }

        acc.status = 'running';
        setBulkAccounts([...updatedAccounts]);

        // If it's a designated retry demonstration account, simulate attempt 1 failure
        const isTransientFailureDemo = (acc.phone.includes('3999') || acc.name.toLowerCase().includes('retry')) && attempt === 1;

        if (isTransientFailureDemo) {
          // Progress partially through steps, then simulate transient Meesho API socket disconnect
          for (let s = 1; s <= 4; s++) {
            acc.currentStep = s;
            setBulkAccounts([...updatedAccounts]);
            await new Promise((r) => setTimeout(r, 65));
          }

          if (autoRetryFailed) {
            showToast(`⚠️ Account #${acc.index || i + 1} (${acc.name}) encountered transient API timeout. Auto-retrying in 10s...`);
            attempt++;
            continue; // Will enter attempt === 2 block, wait 10 seconds, then succeed!
          } else {
            showToast(`❌ Account #${acc.index || i + 1} (${acc.name}) failed. Auto-Retry is disabled.`);
            success = false;
            break; // No retry, marked as failed
          }
        }

        // Execute normal 12-step sequence
        for (let s = 1; s <= 12; s++) {
          acc.currentStep = s;
          setBulkAccounts([...updatedAccounts]);
          await new Promise((r) => setTimeout(r, 65));
        }

        // Successfully protected
        success = true;
        acc.status = 'protected';
        if (attempt === 2) {
          acc.retrySuccess = true;
        }
        break;
      }

      if (!success) {
        acc.status = 'failed';
      }

      setBulkProgress(Math.round(((i + 1) / updatedAccounts.length) * 100));
      setBulkAccounts([...updatedAccounts]);
    }

    try {
      const res = await fetch('/api/meesho/bulk-protect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accounts: updatedAccounts,
          customDummyAddress: dummyAddress,
          autoRetryFailed,
        }),
      });
      const data = await res.json();
      if (data.success && data.outcomes) {
        const merged = updatedAccounts.map((acc, idx) => ({
          ...acc,
          ...(data.outcomes[idx] || {}),
          status: acc.status === 'failed' ? 'failed' : ('protected' as const),
        }));
        setBulkAccounts(merged);
        setBulkCompleted(true);
        showToast(`Bulk Protection Completed! All sessions processed.`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsBulkProtecting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!');
  };

  const protectedCount = orders.filter((o) => o.addressProtected).length;
  const duplicatesCount = bulkAccounts.filter((a) => a.isDuplicate).length;
  const displayedBulkAccounts = filterDuplicatesOnly
    ? bulkAccounts.filter((a) => a.isDuplicate)
    : bulkAccounts;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-fuchsia-600 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-fuchsia-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl border border-fuchsia-400 flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-pink-500 flex items-center justify-center shadow-lg shadow-fuchsia-900/30">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-fuchsia-200 bg-clip-text text-transparent">
                  Meesho Address Shield
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-800/60">
                  Bulk Multi-Session
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Automated 12-Step Meesho Address Scrambler • Single & Bulk TXT/JSON Support
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400">Protected:</span>
              <span className="font-bold text-emerald-400">{protectedCount}/{orders.length} Orders</span>
            </div>

            <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs text-slate-300">
              <Users className="h-3.5 w-3.5 text-fuchsia-400" />
              <span>Bulk Sessions: </span>
              <span className="text-fuchsia-300 font-medium">{bulkAccounts.length} Loaded</span>
              {duplicatesCount > 0 && (
                <span className="text-amber-400 font-bold bg-amber-950/80 px-1.5 py-0.5 rounded text-[10px] border border-amber-800">
                  {duplicatesCount} Dup
                </span>
              )}
            </div>

            <button
              onClick={handleResetOrders}
              title="Reset sample orders"
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-2 border-t border-slate-800/60 text-sm overflow-x-auto">
          <button
            onClick={() => setActiveTab('automate')}
            className={`flex items-center gap-2 py-2.5 px-3.5 border-b-2 font-medium transition whitespace-nowrap ${
              activeTab === 'automate'
                ? 'border-fuchsia-500 text-fuchsia-400 bg-fuchsia-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Single Auto-Protect
          </button>

          {/* Bulk Multi-JSON / TXT Tab */}
          <button
            onClick={() => setActiveTab('bulk')}
            className={`flex items-center gap-2 py-2.5 px-3.5 border-b-2 font-medium transition whitespace-nowrap ${
              activeTab === 'bulk'
                ? 'border-fuchsia-500 text-fuchsia-400 bg-fuchsia-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Users className="h-4 w-4 text-fuchsia-400" />
            <span>Bulk JSON / TXT Runner</span>
            <span className="text-[10px] bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-800 px-1.5 py-0.2 rounded font-bold">
              {bulkAccounts.length} Accounts
            </span>
          </button>

          {/* App Review & Simulator Tab */}
          <button
            onClick={() => setActiveTab('review')}
            className={`flex items-center gap-2 py-2.5 px-3.5 border-b-2 font-medium transition whitespace-nowrap ${
              activeTab === 'review'
                ? 'border-fuchsia-500 text-fuchsia-400 bg-fuchsia-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <SmartphoneNfc className="h-4 w-4 text-pink-400" />
            <span>App Review & Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 py-2.5 px-3.5 border-b-2 font-medium transition whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-fuchsia-500 text-fuchsia-400 bg-fuchsia-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Package className="h-4 w-4" />
            Orders & Address Status ({orders.length})
          </button>

          <button
            onClick={() => setActiveTab('tutorial')}
            className={`flex items-center gap-2 py-2.5 px-3.5 border-b-2 font-medium transition whitespace-nowrap ${
              activeTab === 'tutorial'
                ? 'border-fuchsia-500 text-fuchsia-400 bg-fuchsia-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Layers className="h-4 w-4" />
            12-Step Visual Proofs (10 Screenshots)
          </button>

          <button
            onClick={() => setActiveTab('python')}
            className={`flex items-center gap-2 py-2.5 px-3.5 border-b-2 font-medium transition whitespace-nowrap ${
              activeTab === 'python'
                ? 'border-fuchsia-500 text-fuchsia-400 bg-fuchsia-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Smartphone className="h-4 w-4" />
            Publish on Vercel & Telegram Bot
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-6 w-full flex-1">

        {/* TAB: BULK MULTI-JSON / TXT PROTECTOR */}
        {activeTab === 'bulk' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-fuchsia-400 uppercase tracking-wider">
                    Bulk Multi-Session Protection
                  </span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    Multi-Account Isolated Login
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mt-1">
                  Upload or Paste Bulk JSON / TXT with Multiple Accounts
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  Accepts large files or dumps containing dozens of Meesho JSONs (NDJSON, text files with multiple blocks, or JSON lists). Each account is logged in within a separate isolated session to run the 12-step address protection trick!
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handlePasteClipboardBulk}
                  className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl py-2 px-3.5 text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-fuchsia-900/30"
                >
                  <ClipboardPaste className="h-3.5 w-3.5" />
                  Paste from Clipboard
                </button>

                <button
                  onClick={() => {
                    setBulkInput(DEFAULT_SAMPLE_BULK_TXT);
                    handleParseBulk(DEFAULT_SAMPLE_BULK_TXT);
                    showToast('Loaded 4 sample accounts (includes 1 duplicate demo)!');
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl py-2 px-3 text-xs font-medium transition"
                >
                  Load Sample Bulk TXT
                </button>
              </div>
            </div>

            {/* User Requested: Duplicate Detection Warning & Removal Banner */}
            {duplicatesCount > 0 && (
              <div className="bg-amber-950/40 border border-amber-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-amber-200">
                      {duplicatesCount} Duplicate Account{duplicatesCount > 1 ? 's' : ''} Detected in Bulk List
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Identified based on identical <strong className="text-amber-300">phone numbers</strong> or <strong className="text-amber-300">instance_id</strong> fields. You can remove them before starting automation to avoid duplicate requests.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setFilterDuplicatesOnly(!filterDuplicatesOnly)}
                    className="flex-1 sm:flex-initial text-xs bg-slate-900 hover:bg-slate-800 text-slate-200 px-3 py-2 rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5"
                  >
                    <ListFilter className="h-3.5 w-3.5 text-amber-400" />
                    <span>{filterDuplicatesOnly ? 'Show All Accounts' : 'Filter Duplicates Only'}</span>
                  </button>
                  <button
                    onClick={handleRemoveDuplicates}
                    className="flex-1 sm:flex-initial text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl shadow-lg transition flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove {duplicatesCount} Duplicate{duplicatesCount > 1 ? 's' : ''}</span>
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Bulk Input & File Dropzone (5 Cols) */}
              <div className="lg:col-span-5 space-y-5">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-slate-200 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-fuchsia-400" />
                      Bulk JSON / TXT Input
                    </span>
                    <button
                      onClick={handlePasteClipboardBulk}
                      className="text-xs text-fuchsia-400 hover:text-fuchsia-300 flex items-center gap-1"
                    >
                      <ClipboardPaste className="h-3 w-3" /> Quick Paste
                    </button>
                  </div>

                  <textarea
                    value={bulkInput}
                    onChange={(e) => {
                      setBulkInput(e.target.value);
                      handleParseBulk(e.target.value);
                    }}
                    rows={8}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-fuchsia-500 resize-none"
                    placeholder="Paste multiple JSONs, text dump with JSON blocks, or NDJSON line by line..."
                  />

                  {/* Multi-file upload */}
                  <label className="flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl py-2.5 px-3 text-xs font-medium cursor-pointer transition">
                    <Upload className="h-3.5 w-3.5 text-slate-400" />
                    <span>Upload .txt or .json File(s)</span>
                    <input
                      type="file"
                      multiple
                      accept=".json,.txt,.ndjson,text/plain,application/json"
                      className="hidden"
                      onChange={handleBulkFileUpload}
                    />
                  </label>

                  {/* Detection Banner */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs flex items-center justify-between">
                    <span className="text-slate-400">Total Valid Sessions Detected:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-emerald-400 font-mono">
                        {bulkAccounts.length} Accounts
                      </span>
                      {duplicatesCount > 0 && (
                        <span className="text-amber-400 font-bold font-mono text-xs">
                          ({duplicatesCount} dup)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Randomized Address Setting for Bulk */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-slate-200">Anti-Collision Scrambler</h3>
                    <button
                      onClick={handleRandomizeAddress}
                      className="text-xs text-pink-400 hover:text-pink-300 flex items-center gap-1"
                    >
                      <RefreshCw className="h-3 w-3" /> Shuffle Defaults
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">
                    Each account in the bulk list will automatically receive a <strong>unique randomized dummy phone and address</strong> so sellers cannot correlate multiple accounts.
                  </p>
                  <div className="bg-slate-950 rounded-xl p-3 text-xs text-slate-300 space-y-1">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">
                      Dummy Pattern Sample:
                    </span>
                    <p className="font-bold text-pink-300">{dummyAddress.name} ({dummyAddress.number})</p>
                    <p className="text-slate-400">{dummyAddress.address}, {dummyAddress.road}, {dummyAddress.city} - {dummyAddress.pincode}</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Multi-Account Session Cards & Bulk Runner (7 Cols) */}
              <div className="lg:col-span-7 space-y-5">
                {/* Bulk Execution Control Card */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-fuchsia-950/30 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-semibold text-fuchsia-400 uppercase tracking-wider">
                        Bulk Execution Engine
                      </span>
                      <h3 className="text-xl font-bold text-white mt-0.5">
                        Batch Protect All {bulkAccounts.length} Sessions
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Opens isolated Meesho session per JSON ➔ Scrambles order address ➔ Cancels return.
                      </p>
                    </div>

                    <button
                      onClick={startBulkAutomation}
                      disabled={isBulkProtecting || bulkAccounts.length === 0}
                      className={`w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2.5 transition transform active:scale-95 ${
                        isBulkProtecting || bulkAccounts.length === 0
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white shadow-fuchsia-600/30'
                      }`}
                    >
                      {isBulkProtecting ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin text-fuchsia-400" />
                          <span>Protecting Session {bulkCurrentIndex}/{bulkAccounts.length}...</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 fill-white" />
                          <span>Start Bulk Auto-Protect</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* User Requested: Auto-Retry Failed Sessions Checkbox */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={autoRetryFailed}
                        onChange={(e) => setAutoRetryFailed(e.target.checked)}
                        className="rounded border-slate-700 text-fuchsia-600 focus:ring-0 bg-slate-900 h-4 w-4"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <Timer className="h-3.5 w-3.5 text-fuchsia-400" />
                          Auto-Retry Failed Sessions
                        </span>
                        <p className="text-[11px] text-slate-400">
                          If an account fails, automatically wait 10 seconds and retry the sequence once before marking failed.
                        </p>
                      </div>
                    </label>

                    <span className="text-[10px] font-mono uppercase bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-800 px-2 py-0.5 rounded">
                      {autoRetryFailed ? 'Retry Enabled (10s)' : 'Disabled'}
                    </span>
                  </div>

                  {/* Bulk Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">
                        {isBulkProtecting
                          ? `Processing Account ${bulkCurrentIndex} of ${bulkAccounts.length}`
                          : bulkCompleted
                          ? `All ${bulkAccounts.length} accounts protected successfully!`
                          : `${bulkAccounts.length} accounts queued`}
                      </span>
                      <span className="font-mono font-bold text-fuchsia-400">{bulkProgress}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-fuchsia-600 via-pink-500 to-emerald-400 transition-all duration-300"
                        style={{ width: `${bulkProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Bulk Completed Banner */}
                  {bulkCompleted && (
                    <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-800/80 flex items-start gap-3">
                      <ShieldCheck className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <p className="font-bold text-emerald-300 text-sm">
                          All Accounts Successfully Protected!
                        </p>
                        <p className="text-slate-300 mt-0.5">
                          Every single session JSON has completed the 12-step address scrambling trick.
                          Sellers now hold only dummy addresses for all these accounts.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Parsed Accounts Session List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                    <div className="flex items-center gap-2">
                      <span>Detected Account Sessions ({bulkAccounts.length})</span>
                      {duplicatesCount > 0 && (
                        <button
                          onClick={() => setFilterDuplicatesOnly(!filterDuplicatesOnly)}
                          className="text-[11px] text-amber-400 underline font-medium"
                        >
                          {filterDuplicatesOnly ? 'Show All' : `Show Only ${duplicatesCount} Duplicates`}
                        </button>
                      )}
                    </div>
                    <span>Click card to inspect</span>
                  </div>

                  {displayedBulkAccounts.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
                      {filterDuplicatesOnly
                        ? 'No duplicate accounts found!'
                        : 'No JSON accounts detected. Paste text or upload file on the left.'}
                    </div>
                  ) : (
                    displayedBulkAccounts.map((acc, index) => (
                      <div
                        key={acc.id}
                        onClick={() => setSelectedBulkAccount(acc)}
                        className={`bg-slate-900 border rounded-2xl p-4 transition cursor-pointer shadow-lg hover:border-fuchsia-500/60 ${
                          acc.isDuplicate
                            ? 'border-amber-700/80 bg-amber-950/10'
                            : acc.status === 'protected'
                            ? 'border-emerald-800/80 bg-gradient-to-r from-slate-900 to-emerald-950/20'
                            : acc.status === 'retrying'
                            ? 'border-orange-500 bg-orange-950/20'
                            : acc.status === 'running'
                            ? 'border-fuchsia-600 bg-fuchsia-950/20'
                            : 'border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-8 w-8 rounded-lg bg-slate-800 text-slate-200 flex items-center justify-center font-bold text-xs flex-shrink-0">
                              {acc.index || index + 1}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-slate-200 truncate">{acc.name}</h4>
                                {acc.isDuplicate && (
                                  <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.2 rounded font-bold">
                                    Duplicate
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-mono text-slate-400 truncate">
                                Phone: {acc.phone} • Token: {acc.tokenSnippet}
                              </p>
                              {acc.isDuplicate && (
                                <p className="text-[11px] text-amber-400 mt-0.5">
                                  ⚠️ {acc.duplicateReason}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {acc.status === 'retrying' ? (
                              <span className="text-xs bg-orange-950 text-orange-300 border border-orange-700 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 animate-pulse">
                                <Timer className="h-3 w-3" /> Retrying in {acc.retryCountdownSec ?? 10}s (2/2)
                              </span>
                            ) : acc.status === 'protected' ? (
                              <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                                <Check className="h-3 w-3" />
                                {acc.retrySuccess ? 'Protected (Retried)' : 'Protected'}
                              </span>
                            ) : acc.status === 'running' ? (
                              <span className="text-xs bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-800 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                                <RefreshCw className="h-3 w-3 animate-spin" /> Step {acc.currentStep || 1}/12
                              </span>
                            ) : acc.status === 'failed' ? (
                              <span className="text-xs bg-red-950 text-red-300 border border-red-800 px-2.5 py-1 rounded-full font-medium">
                                Failed (2/2)
                              </span>
                            ) : (
                              <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full font-medium">
                                Ready
                              </span>
                            )}
                          </div>
                        </div>

                        {/* If afterAddress is populated, show preview */}
                        {acc.afterAddress && (
                          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                            <span className="text-emerald-400 text-[11px] font-mono">
                              Dummy Overwrite: {acc.afterAddress.name} ({acc.afterAddress.number}) • {acc.afterAddress.city}
                            </span>
                            <span className="text-[11px] text-fuchsia-400 underline">View Full Audit</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: SINGLE AUTOMATED PROTECTION */}
        {activeTab === 'automate' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center font-bold text-xs">
                      01
                    </div>
                    <div>
                      <h2 className="font-semibold text-slate-100 text-sm">Meesho JSON Login</h2>
                      <p className="text-xs text-slate-400">Paste session token, headers, or upload JSON</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePasteClipboardSingle}
                      className="text-xs text-fuchsia-400 hover:text-fuchsia-300 flex items-center gap-1 bg-fuchsia-950/60 border border-fuchsia-800 px-2 py-0.5 rounded-lg"
                    >
                      <ClipboardPaste className="h-3 w-3" /> Paste Clipboard
                    </button>
                    <button
                      onClick={() => {
                        setJsonInput(DEFAULT_SAMPLE_JSON);
                        handleParseJson(DEFAULT_SAMPLE_JSON);
                        showToast('Loaded sample JSON token!');
                      }}
                      className="text-xs text-slate-400 hover:text-slate-200 underline"
                    >
                      Sample
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="relative">
                    <textarea
                      value={jsonInput}
                      onChange={(e) => {
                        setJsonInput(e.target.value);
                        handleParseJson(e.target.value);
                      }}
                      rows={5}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-fuchsia-500 resize-none"
                      placeholder='{ "token": "...", "phone": "9876543210" }'
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePasteClipboardSingle}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl py-2 px-3 text-xs font-medium transition flex items-center justify-center gap-1.5"
                    >
                      <ClipboardPaste className="h-3.5 w-3.5 text-fuchsia-400" />
                      <span>Paste Clipboard</span>
                    </button>

                    <label className="flex-1 flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl py-2 px-3 text-xs font-medium cursor-pointer transition">
                      <Upload className="h-3.5 w-3.5 text-slate-400" />
                      <span>Upload File</span>
                      <input
                        type="file"
                        accept=".json,application/json,.txt"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const content = event.target?.result as string;
                            setJsonInput(content);
                            handleParseJson(content);
                            showToast('File uploaded!');
                          };
                          reader.readAsText(file);
                        }}
                      />
                    </label>

                    <button
                      onClick={() => handleParseJson(jsonInput)}
                      className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl py-2 px-4 text-xs font-medium transition flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Verify
                    </button>
                  </div>

                  {parsedMeta && (
                    <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-3 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">Token Status:</span>
                        <span className="text-emerald-400 font-medium flex items-center gap-1">
                          <Check className="h-3 w-3" /> Ready for Automation
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">Masked Token:</span>
                        <span className="font-mono text-slate-300">{parsedMeta.tokenSnippet}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">Target Phone:</span>
                        <span className="font-mono text-slate-300">{parsedMeta.phone}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Dummy Masking Address Generator */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold text-xs">
                      02
                    </div>
                    <div>
                      <h2 className="font-semibold text-slate-100 text-sm">Random Dummy Address</h2>
                      <p className="text-xs text-slate-400">Scrambles customer data in Meesho's order database</p>
                    </div>
                  </div>
                  <button
                    onClick={handleRandomizeAddress}
                    className="text-xs text-pink-400 hover:text-pink-300 flex items-center gap-1 bg-pink-950/60 border border-pink-800/50 rounded-lg px-2.5 py-1 transition"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Shuffle
                  </button>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <div>
                      <span className="text-xs text-slate-400">Dummy Name:</span>
                      <p className="font-bold text-sm text-pink-300">{dummyAddress.name}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400">Dummy Contact:</span>
                      <p className="font-mono text-sm text-slate-200">{dummyAddress.number}</p>
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 pt-1">
                    <span className="text-slate-400 block mb-0.5">Scrambled Location:</span>
                    <p className="text-slate-200">
                      {dummyAddress.address}, {dummyAddress.road}, {dummyAddress.city}, {dummyAddress.state} -{' '}
                      <span className="font-mono font-bold text-pink-400">{dummyAddress.pincode}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <button
                    onClick={() => setCustomAddressMode(!customAddressMode)}
                    className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                  >
                    <Sliders className="h-3 w-3" />
                    {customAddressMode ? 'Hide Custom Inputs' : 'Edit Dummy Values'}
                  </button>
                  <span className="text-[11px] text-slate-500">Matches Step 7 tutorial</span>
                </div>

                {customAddressMode && (
                  <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-slate-400 text-[11px]">Dummy Name</label>
                      <input
                        type="text"
                        value={dummyAddress.name}
                        onChange={(e) => setDummyAddress({ ...dummyAddress, name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-[11px]">Dummy Phone</label>
                      <input
                        type="text"
                        value={dummyAddress.number}
                        onChange={(e) => setDummyAddress({ ...dummyAddress, number: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-[11px]">House / Building</label>
                      <input
                        type="text"
                        value={dummyAddress.address}
                        onChange={(e) => setDummyAddress({ ...dummyAddress, address: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-[11px]">Pincode</label>
                      <input
                        type="text"
                        value={dummyAddress.pincode}
                        onChange={(e) => setDummyAddress({ ...dummyAddress, pincode: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Order Target Selection */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="h-7 w-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                    03
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-100 text-sm">Target Meesho Order</h2>
                    <p className="text-xs text-slate-400">Select which order to execute address protection on</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-950 cursor-pointer transition">
                    <input
                      type="radio"
                      name="orderTarget"
                      checked={selectedOrderId === 'all_eligible'}
                      onChange={() => setSelectedOrderId('all_eligible')}
                      className="text-fuchsia-600 focus:ring-0"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-200">
                          ⚡ Protect All Eligible Orders (Batch)
                        </span>
                        <span className="text-[10px] bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-800/60 px-1.5 py-0.5 rounded">
                          Recommended
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Automatically scans all delivered orders within return window
                      </p>
                    </div>
                  </label>

                  {orders.map((ord) => (
                    <label
                      key={ord.orderId}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                        selectedOrderId === ord.orderId
                          ? 'border-fuchsia-600 bg-fuchsia-950/20'
                          : 'border-slate-800 bg-slate-950/40 hover:bg-slate-950'
                      }`}
                    >
                      <input
                        type="radio"
                        name="orderTarget"
                        checked={selectedOrderId === ord.orderId}
                        onChange={() => setSelectedOrderId(ord.orderId)}
                        className="text-fuchsia-600 focus:ring-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-medium text-slate-200 truncate">
                            #{ord.orderId}
                          </span>
                          {ord.addressProtected ? (
                            <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Check className="h-2.5 w-2.5" /> Protected
                            </span>
                          ) : (
                            <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded">
                              Needs Protection
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{ord.title}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Single Executor */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-fuchsia-950/30 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <span className="text-xs font-semibold text-fuchsia-400 uppercase tracking-wider">
                      Automated Protection Engine
                    </span>
                    <h3 className="text-xl font-bold text-white mt-0.5">
                      12-Step Meesho Address Scrambler
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-lg">
                      Applies the community privacy trick: Initiates Return → Injects Random Address →
                      Submits to overwrite database record → Cancels Return so you keep the order safely.
                    </p>
                  </div>

                  <button
                    onClick={startAutomation}
                    disabled={isProtecting}
                    className={`w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2.5 transition transform active:scale-95 ${
                      isProtecting
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white shadow-fuchsia-600/30'
                    }`}
                  >
                    {isProtecting ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin text-fuchsia-400" />
                        <span>Automating Step {currentStepIndex}/12...</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 fill-white" />
                        <span>Start Automated Protection</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      {isProtecting
                        ? `Executing Step ${currentStepIndex} of 12`
                        : completedSuccess
                        ? 'All 12 Steps Completed Successfully!'
                        : 'Ready to execute'}
                    </span>
                    <span className="font-mono font-bold text-fuchsia-400">{progressPercent}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-fuchsia-600 via-pink-500 to-emerald-400 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {completedSuccess && (
                  <div className="mb-6 p-4 rounded-xl bg-emerald-950/50 border border-emerald-800/80 flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-bold text-emerald-300 text-sm">
                        Address Protection Complete!
                      </p>
                      <p className="text-slate-300 mt-0.5">
                        Your real name, contact number, and home address have been scrubbed from Meesho's
                        seller database and replaced by dummy address (<strong>{dummyAddress.name}</strong>,{' '}
                        <strong>{dummyAddress.number}</strong>). The return was cancelled, so you keep your
                        product!
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-950/80 border border-red-900/40 rounded-xl p-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-red-400 flex items-center gap-1.5">
                        <ShieldAlert className="h-3.5 w-3.5" /> Before (Vulnerable)
                      </span>
                      <span className="text-[10px] text-red-400/80 uppercase font-mono">Exposed</span>
                    </div>
                    <div className="text-xs space-y-1 text-slate-300">
                      <p className="font-medium text-slate-200">Amit Sharma</p>
                      <p className="font-mono text-slate-400">+91 6221468377</p>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        50, Radha Duplex, Vijayanagar, Gandhi Chowk, Mysuru, Karnataka, 570008
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 border border-emerald-900/50 rounded-xl p-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5" /> After (Scrambled & Safe)
                      </span>
                      <span className="text-[10px] text-emerald-400/90 uppercase font-mono">Protected</span>
                    </div>
                    <div className="text-xs space-y-1 text-slate-300">
                      <p className="font-medium text-emerald-300">{dummyAddress.name}</p>
                      <p className="font-mono text-slate-400">{dummyAddress.number}</p>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        {dummyAddress.address}, {dummyAddress.road}, {dummyAddress.city}, {dummyAddress.state} -{' '}
                        {dummyAddress.pincode}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-fuchsia-400" />
                    <span className="text-xs font-mono font-semibold text-slate-200">
                      Live Step-by-Step Audit Log
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {auditLogs.length} events logged
                  </span>
                </div>

                <div className="p-4 font-mono text-xs space-y-2.5 max-h-72 overflow-y-auto">
                  {auditLogs.length === 0 ? (
                    <div className="text-slate-500 py-6 text-center italic">
                      Click "Start Automated Protection" to begin the 12-step sequence.
                    </div>
                  ) : (
                    auditLogs.map((log, index) => (
                      <div key={index} className="flex items-start gap-2 text-slate-300">
                        <span className="text-slate-500 text-[11px] flex-shrink-0">
                          [{log.timestamp}]
                        </span>
                        <span className="text-fuchsia-400 font-bold flex-shrink-0">
                          [Step {log.step}]
                        </span>
                        <div className="flex-1">
                          <span className="text-slate-200 font-semibold">{log.title}: </span>
                          <span className="text-slate-400">{log.description}</span>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={terminalBottomRef} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: APP REVIEW & INTERACTIVE SIMULATOR */}
        {activeTab === 'review' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div>
                <span className="text-xs font-semibold text-fuchsia-400 uppercase tracking-wider">
                  Interactive App Review & Simulator
                </span>
                <h2 className="text-xl font-bold text-white mt-0.5">
                  Check How Meesho Address Editing Works Step-by-Step
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  Step through the actual Meesho app screens. Inspect exactly which address fields are rewritten on each step, how the return order forces a database update, and why cancelling preserves your product while keeping your real address masked!
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (simStep > 0) setSimStep(simStep - 1);
                  }}
                  disabled={simStep === 0}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-medium flex items-center gap-1 transition"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <button
                  onClick={() => {
                    if (simStep < TUTORIAL_STEPS.length - 1) setSimStep(simStep + 1);
                  }}
                  disabled={simStep === TUTORIAL_STEPS.length - 1}
                  className="px-4 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1 transition"
                >
                  Next Step ({simStep + 1}/{TUTORIAL_STEPS.length}) <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="w-full max-w-sm bg-slate-950 border-4 border-slate-800 rounded-[2.5rem] p-3 shadow-2xl relative overflow-hidden">
                  <div className="w-32 h-4 bg-slate-800 rounded-full mx-auto mb-2" />
                  
                  <div className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-slate-900 border border-slate-800">
                    <img
                      src={TUTORIAL_STEPS[simStep].img}
                      alt={TUTORIAL_STEPS[simStep].title}
                      className="w-full h-full object-contain"
                    />

                    <div className="absolute top-3 left-3 bg-fuchsia-950/90 border border-fuchsia-700 backdrop-blur text-fuchsia-200 px-2.5 py-1 rounded-lg text-xs font-bold shadow-lg">
                      Step {TUTORIAL_STEPS[simStep].step} of 12
                    </div>

                    <button
                      onClick={() => setSelectedImage(TUTORIAL_STEPS[simStep].img)}
                      className="absolute bottom-3 right-3 bg-slate-950/80 border border-slate-700 text-white text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 hover:bg-slate-900 transition"
                    >
                      <Eye className="h-3 w-3" /> Full View
                    </button>
                  </div>

                  <div className="w-24 h-1 bg-slate-700 rounded-full mx-auto mt-3" />
                </div>

                <div className="flex gap-2 overflow-x-auto w-full max-w-sm mt-4 p-1">
                  {TUTORIAL_STEPS.map((s, idx) => (
                    <button
                      key={s.step}
                      onClick={() => setSimStep(idx)}
                      className={`flex-shrink-0 w-8 h-8 rounded-lg text-xs font-bold border transition ${
                        simStep === idx
                          ? 'border-fuchsia-500 bg-fuchsia-600 text-white shadow-lg'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {s.step}
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-7 space-y-5">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="text-xs bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-800 px-2.5 py-0.5 rounded font-bold">
                      Active Action: Step {TUTORIAL_STEPS[simStep].step}
                    </span>
                    <span className="text-xs text-slate-400">
                      {TUTORIAL_STEPS[simStep].actionText}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {TUTORIAL_STEPS[simStep].title}
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {TUTORIAL_STEPS[simStep].desc}
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                  <div className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-fuchsia-400" />
                    <h3 className="font-bold text-sm text-slate-100">
                      Address Breakdown: Exactly What Changes on Meesho?
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="py-2 px-3 font-semibold">Address Field</th>
                          <th className="py-2 px-3 font-semibold text-red-400">Original (Exposed)</th>
                          <th className="py-2 px-3 font-semibold text-emerald-400">Edited (Protected)</th>
                          <th className="py-2 px-3 font-semibold text-slate-400">Seller View Impact</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        <tr>
                          <td className="py-2.5 px-3 font-medium text-slate-300">Customer Name</td>
                          <td className="py-2.5 px-3 font-mono text-slate-400">Amit Sharma</td>
                          <td className="py-2.5 px-3 font-mono text-emerald-400 font-bold">Aaaa</td>
                          <td className="py-2.5 px-3 text-slate-400">Seller cannot see real identity</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-medium text-slate-300">Mobile Number</td>
                          <td className="py-2.5 px-3 font-mono text-slate-400">+91 6221468377</td>
                          <td className="py-2.5 px-3 font-mono text-emerald-400 font-bold">+91 9876543210</td>
                          <td className="py-2.5 px-3 text-slate-400">Protected from phone spammers / WhatsApp spam</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-medium text-slate-300">House / Building</td>
                          <td className="py-2.5 px-3 font-mono text-slate-400">50, Radha Duplex</td>
                          <td className="py-2.5 px-3 font-mono text-emerald-400 font-bold">abcd</td>
                          <td className="py-2.5 px-3 text-slate-400">Real building scrubbed</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-medium text-slate-300">Street / Colony</td>
                          <td className="py-2.5 px-3 font-mono text-slate-400">Vijayanagar, Gandhi Chowk</td>
                          <td className="py-2.5 px-3 font-mono text-emerald-400 font-bold">edghi</td>
                          <td className="py-2.5 px-3 text-slate-400">Local street scrubbed</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-medium text-slate-300">City, State & Pin</td>
                          <td className="py-2.5 px-3 font-mono text-slate-400">Mysuru, Karnataka 570008</td>
                          <td className="py-2.5 px-3 font-mono text-emerald-400 font-bold">Delhi, Delhi 110001</td>
                          <td className="py-2.5 px-3 text-slate-400">Geographic location scrubbed</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-medium text-slate-300">Delivered Product</td>
                          <td className="py-2.5 px-3 text-slate-300">Delivered to Buyer</td>
                          <td className="py-2.5 px-3 text-emerald-400 font-bold">Kept by Buyer (Return Cancelled)</td>
                          <td className="py-2.5 px-3 text-emerald-400">You keep the item safely</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS LIST & ADDRESS STATUS */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Delivered Orders & Address Status</h2>
                <p className="text-xs text-slate-400">
                  Inspect the active shipping address linked to each order on Meesho
                </p>
              </div>
              <button
                onClick={handleResetOrders}
                className="text-xs text-fuchsia-400 hover:text-fuchsia-300 flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Sample State
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orders.map((order) => (
                <div
                  key={order.orderId}
                  className={`bg-slate-900 border rounded-2xl p-5 space-y-4 shadow-xl ${
                    order.addressProtected
                      ? 'border-emerald-800/80 bg-gradient-to-b from-slate-900 to-emerald-950/20'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-mono text-slate-400 block">
                        Order #{order.orderId}
                      </span>
                      <h3 className="font-bold text-sm text-slate-100 mt-0.5">{order.title}</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Status: <span className="text-slate-200">{order.status}</span> ({order.deliveredDate})
                      </p>
                    </div>
                    {order.addressProtected ? (
                      <span className="text-xs bg-emerald-950 border border-emerald-800 text-emerald-300 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Scrambled & Safe
                      </span>
                    ) : (
                      <span className="text-xs bg-amber-950 border border-amber-800 text-amber-300 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Real Address Exposed
                      </span>
                    )}
                  </div>

                  <div className="bg-slate-950 rounded-xl p-3 text-xs border border-slate-800/80 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Database Recorded Pickup/Shipping Address:
                    </span>
                    <p className="font-semibold text-slate-200">{order.currentAddress.name}</p>
                    <p className="font-mono text-slate-400">{order.currentAddress.number}</p>
                    <p className="text-slate-400 text-[11px]">
                      {order.currentAddress.address}, {order.currentAddress.city},{' '}
                      {order.currentAddress.state} - {order.currentAddress.pincode}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
                    <span className="text-slate-400">
                      Return Window: <strong className="text-slate-200">{order.returnAvailableTill}</strong>
                    </span>
                    {!order.addressProtected ? (
                      <button
                        onClick={() => {
                          setSelectedOrderId(order.orderId);
                          setActiveTab('automate');
                        }}
                        className="text-xs text-fuchsia-400 hover:text-fuchsia-300 font-medium flex items-center gap-1"
                      >
                        Protect This Order <ArrowRight className="h-3 w-3" />
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                        <Check className="h-3 w-3" /> Order Kept & Protected
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: 12-STEP VISUAL PROOFS & USER SCREENSHOTS */}
        {activeTab === 'tutorial' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">12-Step Visual Proofs & Workflow</h2>
              <p className="text-xs text-slate-400">
                These are the exact 10 screenshots demonstrating the Meesho address protection method
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {TUTORIAL_STEPS.map((step) => (
                <div
                  key={step.step}
                  onClick={() => setSelectedImage(step.img)}
                  className="bg-slate-900 border border-slate-800 hover:border-fuchsia-500/60 rounded-2xl p-3 space-y-3 cursor-pointer group transition shadow-lg"
                >
                  <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                    <img
                      src={step.img}
                      alt={step.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur border border-slate-700/80 rounded-lg px-2 py-0.5 text-[11px] font-bold text-fuchsia-300">
                      Step {step.step}
                    </div>
                    <div className="absolute inset-0 bg-fuchsia-950/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <span className="bg-slate-900/90 text-white text-xs px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1">
                        <Eye className="h-3 w-3" /> Click to Zoom
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-xs text-slate-100 group-hover:text-fuchsia-300 transition">
                      {step.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: VERCEL DEPLOYMENT & TELEGRAM BOT */}
        {activeTab === 'python' && (
          <div className="space-y-6 max-w-5xl">
            <div>
              <span className="text-xs font-semibold text-fuchsia-400 uppercase tracking-wider">
                Production Deployment & Bots
              </span>
              <h2 className="text-xl font-bold text-white mt-0.5">
                Publish on Vercel & Telegram Bot Integration
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Deploy your Meesho Address Shield as a high-speed web app on Vercel, and run it as an automated Telegram Bot & Telegram Mini App!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Publish to Vercel */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white text-black flex items-center justify-center font-bold text-lg shadow-lg">
                      ▲
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white">Deploy to Vercel</h3>
                      <p className="text-xs text-slate-400">Zero-config Vite React deployment</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    This project includes a pre-configured <code className="text-fuchsia-400 font-mono">vercel.json</code> in the root directory. Vercel automatically builds the Vite app into <code className="text-fuchsia-400 font-mono">dist</code> and sets up clean SPA rewrites.
                  </p>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 font-mono text-xs text-slate-300 space-y-1">
                    <p className="text-slate-500 font-sans font-bold text-[11px] uppercase tracking-wider">
                      Steps to Publish:
                    </p>
                    <p>1. Push this project to your GitHub repo</p>
                    <p>2. Open <span className="text-fuchsia-400">vercel.com/new</span></p>
                    <p>3. Select repo & click <span className="text-emerald-400 font-bold">Deploy</span></p>
                    <p className="text-slate-500 pt-1"># vercel.json handles build and rewrites automatically!</p>
                  </div>
                </div>

                <div className="pt-2">
                  <a
                    href="https://vercel.com/new"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-white hover:bg-slate-200 text-black rounded-xl py-2.5 px-4 text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg"
                  >
                    <span>▲ Open Vercel New Project</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              {/* Card 2: Telegram Bot & Mini App */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[#229ED9]/20 text-[#229ED9] flex items-center justify-center font-bold text-lg shadow-lg">
                      ✈
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white">Telegram Bot & Mini App</h3>
                      <p className="text-xs text-slate-400">Run in chats or as an in-app Telegram WebApp</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Use <code className="text-fuchsia-400 font-mono">bot.py</code> to run a bot that accepts single JSONs or bulk <code className="text-fuchsia-400 font-mono">.txt</code> dumps in chat, and embeds this full web app as a <strong>Telegram Mini App</strong>!
                  </p>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 font-mono text-xs text-slate-300 space-y-1">
                    <p className="text-slate-500 font-sans font-bold text-[11px] uppercase tracking-wider">
                      Setup with @BotFather:
                    </p>
                    <p>1. Open <span className="text-[#229ED9]">@BotFather</span> and type /newbot</p>
                    <p>2. Set Menu Button: <span className="text-fuchsia-400">/setmenubutton</span></p>
                    <p>3. Enter your Vercel or App URL</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <a
                    href="/public/bot.py"
                    download="bot.py"
                    className="flex-1 bg-[#229ED9] hover:bg-[#1f8ec4] text-white rounded-xl py-2.5 px-3 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-[#229ED9]/20"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download bot.py</span>
                  </a>
                  <a
                    href="/public/requirements.txt"
                    download="requirements.txt"
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl py-2.5 px-3 text-xs font-medium transition flex items-center justify-center gap-1"
                  >
                    <Download className="h-3 w-3" />
                    <span>requirements.txt</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Run in Terminal or Android Termux */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Terminal className="h-5 w-5 text-fuchsia-400" />
                  <h3 className="font-bold text-sm text-slate-100">
                    Run bot.py on PC, VPS, or Android Termux
                  </h3>
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(
                      'pip install -r requirements.txt\nexport TELEGRAM_BOT_TOKEN="your_bot_token"\nexport APP_URL="https://your-app.vercel.app"\npython bot.py'
                    )
                  }
                  className="text-xs text-fuchsia-400 hover:text-fuchsia-300 flex items-center gap-1 bg-fuchsia-950/60 border border-fuchsia-800 px-2.5 py-1 rounded-lg transition"
                >
                  <Copy className="h-3 w-3" /> Copy Run Script
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 space-y-1">
                <p className="text-slate-500"># 1. Install dependencies</p>
                <p>pip install -r requirements.txt</p>
                <p className="text-slate-500 pt-1"># 2. Configure environment variables</p>
                <p>export TELEGRAM_BOT_TOKEN="<span className="text-fuchsia-400">your_botfather_token</span>"</p>
                <p>export APP_URL="<span className="text-fuchsia-400">https://your-vercel-or-app-url.app</span>"</p>
                <p className="text-slate-500 pt-1"># 3. Start bot</p>
                <p className="text-emerald-400 font-bold">python bot.py</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Account Audit Details Modal */}
      {selectedBulkAccount && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedBulkAccount(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] text-fuchsia-400 font-mono">Isolated Session Details</span>
                <h3 className="font-bold text-base text-white">{selectedBulkAccount.name}</h3>
              </div>
              <button
                onClick={() => setSelectedBulkAccount(null)}
                className="text-slate-400 hover:text-white text-xs bg-slate-800 px-2.5 py-1 rounded-lg"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Target Phone:</span>
                <p className="font-mono text-slate-200 mt-0.5">{selectedBulkAccount.phone}</p>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Status:</span>
                <p className="font-bold text-emerald-400 mt-0.5 uppercase">{selectedBulkAccount.status}</p>
              </div>
            </div>

            {selectedBulkAccount.instance_id && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Device Instance ID:</span>
                <p className="font-mono text-slate-300 mt-0.5 break-all">{selectedBulkAccount.instance_id}</p>
              </div>
            )}

            {selectedBulkAccount.isDuplicate && (
              <div className="bg-amber-950/40 p-3 rounded-xl border border-amber-800 text-xs text-amber-300">
                <span className="font-bold block">⚠️ Duplicate Detected:</span>
                <p>{selectedBulkAccount.duplicateReason}</p>
              </div>
            )}

            {selectedBulkAccount.afterAddress && (
              <div className="bg-slate-950 p-3.5 rounded-xl border border-emerald-900/60 text-xs space-y-1">
                <span className="text-emerald-400 font-bold block">🔒 Scrambled Address Overwrite:</span>
                <p className="font-semibold text-slate-200">{selectedBulkAccount.afterAddress.name}</p>
                <p className="font-mono text-slate-400">{selectedBulkAccount.afterAddress.number}</p>
                <p className="text-slate-400 text-[11px]">
                  {selectedBulkAccount.afterAddress.address}, {selectedBulkAccount.afterAddress.road},{' '}
                  {selectedBulkAccount.afterAddress.city} - {selectedBulkAccount.afterAddress.pincode}
                </p>
              </div>
            )}

            <div className="text-[11px] text-slate-400 bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="font-semibold text-slate-300 block">Session Token Fingerprint:</span>
              <p className="font-mono text-slate-500 break-all">{selectedBulkAccount.tokenSnippet}</p>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Screenshots */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-md w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white text-sm bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700"
            >
              ✕ Close
            </button>
            <img
              src={selectedImage}
              alt="Tutorial screenshot zoomed"
              className="w-full h-auto max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-slate-800"
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-4 text-center text-xs text-slate-500">
        <p>
          Meesho Address Shield • Automated Buyer Privacy & Anti-Scraper Tool • Bulk Multi-Account & Clipboard Support
        </p>
      </footer>
    </div>
  );
}
