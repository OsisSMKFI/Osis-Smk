"use client";
import React from 'react';
import { createPortal } from 'react-dom';
import { FaComments, FaTimes, FaRobot, FaTrash, FaPaperPlane, FaWindowMinimize, FaWindowMaximize, FaWindowRestore, FaGripVertical, FaPlus, FaImage, FaFileAlt, FaExternalLinkAlt, FaArrowRight, FaInfoCircle, FaUsers, FaCalendarAlt, FaBook, FaBriefcase, FaImages, FaNewspaper, FaBullhorn, FaUserCircle, FaHome, FaHeart, FaQuestionCircle, FaBell, FaEnvelope, FaPalette, FaEye, FaUserShield, FaMagic, FaCheck, FaCog } from 'react-icons/fa';
import ChatBoundary from './ChatBoundary';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════════════════════
// 🔥 WEBOSIS LIVE CHAT WIDGET - ULTIMATE PREMIUM v5.0
// ═══════════════════════════════════════════════════════════════════════════════
// Features:
// - Elegant minimalist responsive design
// - Message forwarding to admin/super admin
// - Design preview & realtime editing
// - Full AI conversation capabilities
// - Admin notification system
// ═══════════════════════════════════════════════════════════════════════════════

// 🔗 SMART LINK DETECTION SYSTEM - Premium Feature
// Detects context in AI messages and provides quick navigation buttons
type QuickLinkConfig = {
  keywords: string[];
  path: string;
  label: string;
  icon: React.ReactNode;
  description: string;
};

// Message forwarding types
type ForwardTarget = 'osis' | 'admin' | 'super_admin';
type MessageForward = {
  target: ForwardTarget;
  message: string;
  senderName?: string;
  urgent: boolean;
  timestamp: string;
};

// Design preview types
type DesignPreview = {
  component: string;
  styles: Record<string, string>;
  preview: string;
  approved: boolean;
};

// Comprehensive page mapping for smart link detection

// Comprehensive page mapping for smart link detection
const QUICK_LINKS: QuickLinkConfig[] = [
  // About & Philosophy
  { keywords: ['filosofi', 'visi', 'misi', 'nilai', 'makna logo', 'sejarah osis', 'tentang osis', 'apa itu osis'], path: '/about', label: 'Tentang OSIS', icon: <FaInfoCircle size={12} />, description: 'Filosofi, visi, misi, dan nilai OSIS' },
  // Members & People
  { keywords: ['anggota', 'pengurus', 'ketua', 'wakil', 'sekretaris', 'bendahara', 'struktur organisasi', 'kepengurusan'], path: '/people', label: 'Pengurus OSIS', icon: <FaUsers size={12} />, description: 'Lihat semua pengurus dan anggota' },
  // Sekbid
  { keywords: ['sekbid', 'seksi bidang', 'bidang'], path: '/sekbid', label: 'Seksi Bidang', icon: <FaBriefcase size={12} />, description: 'Eksplorasi semua seksi bidang' },
  { keywords: ['sekbid 1', 'keimanan', 'ketakwaan', 'imtaq', 'rohis'], path: '/sekbid/sekbid-1', label: 'Sekbid 1 - IMTAQ', icon: <FaHeart size={12} />, description: 'Keimanan & Ketakwaan' },
  { keywords: ['sekbid 2', 'budi pekerti', 'karakter', 'akhlak'], path: '/sekbid/sekbid-2', label: 'Sekbid 2 - Budi Pekerti', icon: <FaHeart size={12} />, description: 'Pembinaan Budi Pekerti' },
  { keywords: ['sekbid 3', 'kepribadian', 'wawasan kebangsaan'], path: '/sekbid/sekbid-3', label: 'Sekbid 3 - Kepribadian', icon: <FaHeart size={12} />, description: 'Kepribadian & Kebangsaan' },
  { keywords: ['sekbid 4', 'kepemimpinan', 'leadership'], path: '/sekbid/sekbid-4', label: 'Sekbid 4 - Kepemimpinan', icon: <FaHeart size={12} />, description: 'Kepemimpinan' },
  { keywords: ['sekbid 5', 'keterampilan', 'kewirausahaan'], path: '/sekbid/sekbid-5', label: 'Sekbid 5 - Keterampilan', icon: <FaHeart size={12} />, description: 'Keterampilan & Kewirausahaan' },
  { keywords: ['sekbid 6', 'kesegaran jasmani', 'olahraga', 'sehat'], path: '/sekbid/sekbid-6', label: 'Sekbid 6 - Jasmani', icon: <FaHeart size={12} />, description: 'Kesegaran Jasmani' },
  { keywords: ['sekbid 7', 'persepsi', 'apresiasi', 'seni', 'kreasi'], path: '/sekbid/sekbid-7', label: 'Sekbid 7 - Seni', icon: <FaHeart size={12} />, description: 'Persepsi, Apresiasi & Kreasi Seni' },
  { keywords: ['sekbid 8', 'demokrasi', 'ham', 'hak asasi'], path: '/sekbid/sekbid-8', label: 'Sekbid 8 - Demokrasi', icon: <FaHeart size={12} />, description: 'Demokrasi & HAM' },
  { keywords: ['sekbid 9', 'sastra', 'budaya', 'bahasa'], path: '/sekbid/sekbid-9', label: 'Sekbid 9 - Sastra Budaya', icon: <FaHeart size={12} />, description: 'Sastra & Budaya' },
  { keywords: ['sekbid 10', 'ict', 'teknologi', 'informatika', 'komputer'], path: '/sekbid/sekbid-10', label: 'Sekbid 10 - ICT', icon: <FaHeart size={12} />, description: 'ICT & Komunikasi' },
  // Events & Activities
  { keywords: ['event', 'kegiatan', 'acara', 'agenda', 'jadwal', 'kalender'], path: '/info', label: 'Event & Info', icon: <FaCalendarAlt size={12} />, description: 'Event dan kegiatan terbaru' },
  // Gallery
  { keywords: ['galeri', 'gallery', 'foto', 'photo', 'dokumentasi', 'gambar kegiatan'], path: '/gallery', label: 'Galeri', icon: <FaImages size={12} />, description: 'Dokumentasi foto kegiatan' },
  // Posts & News
  { keywords: ['berita', 'artikel', 'post', 'news', 'update', 'informasi terbaru'], path: '/posts', label: 'Berita & Artikel', icon: <FaNewspaper size={12} />, description: 'Berita dan artikel terbaru' },
  // Announcements
  { keywords: ['pengumuman', 'announcement', 'pemberitahuan', 'info penting'], path: '/info', label: 'Pengumuman', icon: <FaBullhorn size={12} />, description: 'Pengumuman penting' },
  // Profile
  { keywords: ['profil', 'profile', 'akun saya', 'data diri', 'biodata'], path: '/profile', label: 'Profil Saya', icon: <FaUserCircle size={12} />, description: 'Lihat dan edit profil' },
  // Home
  { keywords: ['beranda', 'home', 'halaman utama', 'dashboard'], path: '/', label: 'Beranda', icon: <FaHome size={12} />, description: 'Kembali ke beranda' },
  // Program Kerja
  { keywords: ['proker', 'program kerja', 'rencana kerja', 'agenda kerja'], path: '/info', label: 'Program Kerja', icon: <FaBook size={12} />, description: 'Lihat program kerja OSIS' },
  // Register/Enroll
  { keywords: ['daftar', 'registrasi', 'gabung', 'join', 'pendaftaran anggota'], path: '/register', label: 'Daftar Anggota', icon: <FaUsers size={12} />, description: 'Daftar jadi anggota OSIS' },
  // Contact/Social
  { keywords: ['kontak', 'hubungi', 'contact', 'sosial media', 'instagram', 'social'], path: '/our-social-media', label: 'Sosial Media', icon: <FaExternalLinkAlt size={12} />, description: 'Ikuti media sosial kami' },
];

// Function to detect relevant links from message content
function detectQuickLinks(content: string): QuickLinkConfig[] {
  const lowerContent = content.toLowerCase();
  const detected: QuickLinkConfig[] = [];
  const addedPaths = new Set<string>();
  
  for (const link of QUICK_LINKS) {
    for (const keyword of link.keywords) {
      if (lowerContent.includes(keyword) && !addedPaths.has(link.path)) {
        detected.push(link);
        addedPaths.add(link.path);
        break;
      }
    }
  }
  
  // Limit to max 3 most relevant links
  return detected.slice(0, 3);
}

// Quick action types for more interactivity
type QuickAction = {
  label: string;
  action: string;
  icon: React.ReactNode;
};

// Detect quick actions from AI response
function detectQuickActions(content: string): QuickAction[] {
  const lowerContent = content.toLowerCase();
  const actions: QuickAction[] = [];
  
  // Suggest related questions based on content
  if (lowerContent.includes('ketua') || lowerContent.includes('pengurus')) {
    actions.push({ label: 'Lihat semua pengurus', action: 'Siapa saja pengurus OSIS?', icon: <FaUsers size={10} /> });
  }
  if (lowerContent.includes('event') || lowerContent.includes('kegiatan') || lowerContent.includes('acara')) {
    actions.push({ label: 'Event mendatang', action: 'Apa event OSIS yang akan datang?', icon: <FaCalendarAlt size={10} /> });
  }
  if (lowerContent.includes('sekbid') || lowerContent.includes('seksi bidang')) {
    actions.push({ label: 'Info sekbid lain', action: 'Jelaskan semua sekbid OSIS', icon: <FaBriefcase size={10} /> });
  }
  if (lowerContent.includes('filosofi') || lowerContent.includes('visi') || lowerContent.includes('misi')) {
    actions.push({ label: 'Sejarah OSIS', action: 'Ceritakan sejarah OSIS SMK ini', icon: <FaBook size={10} /> });
  }
  if (lowerContent.includes('galeri') || lowerContent.includes('foto')) {
    actions.push({ label: 'Lihat galeri', action: 'Tunjukkan galeri foto OSIS', icon: <FaImages size={10} /> });
  }
  if (lowerContent.includes('daftar') || lowerContent.includes('gabung')) {
    actions.push({ label: 'Cara daftar', action: 'Bagaimana cara mendaftar jadi anggota OSIS?', icon: <FaQuestionCircle size={10} /> });
  }
  
  return actions.slice(0, 2); // Max 2 quick actions
}

export default function LiveChatWidget({ role, showFloating = true }: { role?: 'super_admin' | 'member' | 'guest', showFloating?: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [messages, setMessages] = React.useState<{ role: 'user' | 'assistant'; content: string; image?: string; isForward?: boolean; forwardTarget?: ForwardTarget }[]>([]);
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [provider, setProvider] = React.useState<'auto'|'anthropic'|'gemini'|'openai'>('auto');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = React.useState(false);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = React.useState<{ cmd: string; desc: string; template?: string }[]>([]);
  const [selectedIndex, setSelectedIndex] = React.useState<number>(-1);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  // Minimal mode toggle (default true for elegant compact design)
  const [minimal, setMinimal] = React.useState(true);
  
  // 🔔 Message forwarding & notification states
  const [showForwardModal, setShowForwardModal] = React.useState(false);
  const [forwardMessage, setForwardMessage] = React.useState('');
  const [forwardTarget, setForwardTarget] = React.useState<ForwardTarget>('osis');
  const [forwardUrgent, setForwardUrgent] = React.useState(false);
  const [forwardSent, setForwardSent] = React.useState(false);
  const [lastReplyCheck, setLastReplyCheck] = React.useState<string | null>(null);
  
  // 🎨 Design preview states (Super Admin only)
  const [showDesignPreview, setShowDesignPreview] = React.useState(false);
  const [designPreview, setDesignPreview] = React.useState<DesignPreview | null>(null);
  const [designLoading, setDesignLoading] = React.useState(false);
  const [designApplying, setDesignApplying] = React.useState(false);
  
  // 🎨 Dynamic design CSS from database
  const [customDesignCSS, setCustomDesignCSS] = React.useState<string | null>(null);
  
  // Image upload state
  const [uploadedImage, setUploadedImage] = React.useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = React.useState<string>('');
  
  // Auto-resize textarea
  React.useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 128) + 'px';
    }
  }, [input]);
  
  // Window controls (desktop only)
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [isMaximized, setIsMaximized] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [size, setSize] = React.useState({ width: 400, height: 480 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [isResizing, setIsResizing] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const dragRef = React.useRef<HTMLDivElement>(null);

  // Initialize position to bottom-right on mount (desktop only)
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth > 640) {
      setPosition({
        x: window.innerWidth - size.width - 24,
        y: window.innerHeight - size.height - 24,
      });
    }
  }, []);

  // 🎨 Load custom design CSS from database on mount
  React.useEffect(() => {
    const loadCustomDesign = async () => {
      try {
        const response = await fetch('/api/ai/execute-action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'get_status',
            params: { taskSessionId: 'design_chat_input' },
          }),
        });
        
        // Also try to get design from page_content
        const designRes = await fetch('/api/public/background?key=design_override_chat_input');
        if (designRes.ok) {
          const data = await designRes.json();
          if (data.content_value) {
            setCustomDesignCSS(data.content_value);
            console.log('[LiveChat] ✅ Custom design loaded from database');
          }
        }
      } catch (e) {
        console.warn('[LiveChat] Failed to load custom design:', e);
      }
    };
    
    if (mounted) {
      loadCustomDesign();
    }
  }, [mounted]);

  const mode: 'admin' | 'public' = role === 'super_admin' ? 'admin' : 'public';
  const suggestionsEnabled = process.env.NEXT_PUBLIC_CHAT_SUGGESTIONS !== '0';

  // ═══════════════════════════════════════════════════════════════════════════
  // 📨 MESSAGE FORWARDING SYSTEM - Forward to Admin/OSIS
  // ═══════════════════════════════════════════════════════════════════════════
  const forwardToAdmin = async (target: ForwardTarget, message: string, urgent: boolean = false) => {
    try {
      const response = await fetch('/api/notifications/forward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target,
          message,
          urgent,
          sessionId,
          timestamp: new Date().toISOString(),
        }),
      });
      
      if (response.ok) {
        setForwardSent(true);
        setTimeout(() => setForwardSent(false), 3000);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Forward error:', error);
      return false;
    }
  };
  
  // ═══════════════════════════════════════════════════════════════════════════
  // 🎨 DESIGN PREVIEW SYSTEM - Realtime Design Changes (Super Admin)
  // ═══════════════════════════════════════════════════════════════════════════
  const requestDesignChange = async (component: string, changes: string) => {
    if (mode !== 'admin') return null;
    
    setDesignLoading(true);
    try {
      const response = await fetch('/api/admin/design-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ component, changes }),
      });
      
      if (response.ok) {
        const preview = await response.json();
        setDesignPreview(preview);
        setShowDesignPreview(true);
        return preview;
      }
      return null;
    } catch (error) {
      console.error('Design preview error:', error);
      return null;
    } finally {
      setDesignLoading(false);
    }
  };
  
  const applyDesignChange = async () => {
    if (!designPreview || mode !== 'admin') return false;
    
    setDesignApplying(true);
    try {
      const response = await fetch('/api/admin/design/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          component: designPreview.component,
          cssCode: designPreview.preview,
          styles: designPreview.styles,
          preset: 'custom',
          description: `AI Design change for ${designPreview.component}`,
        }),
      });
      
      if (response.ok) {
        setDesignPreview(null);
        setShowDesignPreview(false);
        // Add success message to chat
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `✅ Design untuk **${designPreview.component}** berhasil diterapkan! Refresh halaman untuk melihat perubahan.`
        }]);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Design apply error:', error);
      return false;
    } finally {
      setDesignApplying(false);
    }
  };

  type Command = { cmd: string; desc: string; template?: string };
  const adminCommands: Command[] = React.useMemo(() => ([
    { cmd: '/help', desc: 'Daftar perintah lengkap', template: '/help' },
    { cmd: '/errors list', desc: 'Dashboard error terbaru', template: '/errors list' },
    { cmd: '/analyze', desc: 'Deep AI analysis error', template: '/analyze <error_id>' },
    { cmd: '/fix', desc: 'Auto-fix dengan AI Premium', template: '/fix <error_id>' },
    { cmd: '/generate', desc: 'Generate gambar dengan AI', template: '/generate <prompt>' },
    { cmd: '/design', desc: '🎨 Redesign komponen realtime', template: '/design <component> <perubahan>' },
    { cmd: '/preview', desc: '👁️ Preview perubahan design', template: '/preview' },
    { cmd: '/apply-design', desc: '✅ Terapkan design baru', template: '/apply-design' },
    { cmd: '/sql', desc: 'Execute SQL query', template: '/sql SELECT * FROM posts LIMIT 5' },
    { cmd: '/query', desc: 'Query table dengan filter', template: '/query posts status=published limit=10' },
    { cmd: '/schema', desc: 'Show database schema', template: '/schema' },
    { cmd: '/stats', desc: 'Show system statistics', template: '/stats' },
    { cmd: '/notifications', desc: '🔔 Lihat notifikasi masuk', template: '/notifications' },
    { cmd: '/reply', desc: '💬 Balas pesan user', template: '/reply <user_id> <pesan>' },
    { cmd: '/broadcast', desc: '📢 Broadcast ke semua user', template: '/broadcast <pesan>' },
    { cmd: '/confirm', desc: 'Konfirmasi aksi pending', template: '/confirm' },
    { cmd: '/cancel', desc: 'Batalkan aksi pending', template: '/cancel' },
    { cmd: '/run', desc: 'Jalankan terminal command', template: '/run <command>' },
    { cmd: '/config get', desc: 'Lihat konfigurasi', template: '/config get <KEY>' },
    { cmd: '/config set', desc: 'Update konfigurasi', template: '/config set <KEY>=<VALUE>' },
    { cmd: '/clear', desc: 'Hapus riwayat chat', template: '/clear' },
  ]), []);

  // Simple fuzzy scoring: returns match quality or null
  const fuzzyMatch = (pattern: string, target: string): number | null => {
    pattern = pattern.toLowerCase();
    target = target.toLowerCase();
    let ti = 0; let score = 0;
    for (let pi = 0; pi < pattern.length; pi++) {
      const pch = pattern[pi];
      let found = false;
      while (ti < target.length) {
        if (target[ti] === pch) { score += 1; ti++; found = true; break; }
        ti++;
      }
      if (!found) return null;
    }
    return score;
  };

  // Build suggestions when user types "/"
  React.useEffect(() => {
    if (!suggestionsEnabled || paletteOpen) {
      if (!paletteOpen) {
        setShowSuggestions(false);
        setFilteredSuggestions([]);
        setSelectedIndex(-1);
      }
      return;
    }
    const v = input;
    if (!v.startsWith('/')) {
      setShowSuggestions(false);
      setFilteredSuggestions([]);
      setSelectedIndex(-1);
      return;
    }
    const base = (mode === 'admin') ? adminCommands : [];
    const lower = v.toLowerCase();
    const items = base.filter(b => b.cmd.toLowerCase().startsWith(lower)).slice(0, 8);
    // If user only typed "/", show top suggestions
    const finalItems = lower === '/' ? base.slice(0, 8) : items;
    setFilteredSuggestions(finalItems);
    setShowSuggestions(finalItems.length > 0);
    setSelectedIndex(finalItems.length ? 0 : -1);
  }, [input, mode, adminCommands, suggestionsEnabled, paletteOpen]);

  // Load persisted state from localStorage
  React.useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('livechat_state');
    if (saved) {
      try {
        const { messages: savedMessages, sessionId: savedSessionId, open: savedOpen, provider: savedProvider } = JSON.parse(saved);
        if (savedMessages) setMessages(savedMessages);
        if (savedSessionId) setSessionId(savedSessionId);
        if (savedOpen !== undefined) setOpen(savedOpen);
        if (savedProvider) setProvider(savedProvider);
      } catch (e) {
        console.error('Failed to load chat state:', e);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes (exclude images to save space)
  React.useEffect(() => {
    try {
      // Don't save images in localStorage to prevent quota exceeded
      const messagesWithoutImages = messages.map(m => ({
        role: m.role,
        content: m.content,
        // Exclude image field
      }));
      localStorage.setItem('livechat_state', JSON.stringify({ 
        messages: messagesWithoutImages, 
        sessionId, 
        open, 
        provider 
      }));
    } catch (e: any) {
      if (e.name === 'QuotaExceededError') {
        console.warn('[LiveChat] localStorage quota exceeded, clearing old state');
        localStorage.removeItem('livechat_state');
      }
    }
  }, [messages, sessionId, open, provider]);

  // ═══════════════════════════════════════════════════════════════════════════
  // 📨 POLL FOR ADMIN REPLIES - Check if admin has replied to forwarded message
  // ═══════════════════════════════════════════════════════════════════════════
  React.useEffect(() => {
    if (!sessionId || mode === 'admin') return; // Only for public users

    const checkForReplies = async () => {
      try {
        const response = await fetch(`/api/admin/notifications/reply?sessionId=${sessionId}`);
        if (!response.ok) return;
        
        const data = await response.json();
        if (data.replies && data.replies.length > 0) {
          // Find new replies we haven't shown yet
          data.replies.forEach((reply: any) => {
            const replyId = reply.id || reply.created_at;
            if (lastReplyCheck !== replyId) {
              // Add reply as assistant message
              setMessages(prev => {
                // Check if we already have this reply
                const alreadyHave = prev.some(m => 
                  m.content.includes(reply.message) && 
                  m.content.includes('Admin')
                );
                if (alreadyHave) return prev;
                
                return [...prev, {
                  role: 'assistant' as const,
                  content: `📨 **Balasan dari ${reply.sender_name || 'Admin'}:**\n\n${reply.message}`
                }];
              });
              setLastReplyCheck(replyId);
            }
          });
        }
      } catch (e) {
        // Silent fail
      }
    };

    // Check immediately and then every 15 seconds
    checkForReplies();
    const interval = setInterval(checkForReplies, 15000);
    return () => clearInterval(interval);
  }, [sessionId, mode, lastReplyCheck]);

  // Drag handlers (desktop only)
  React.useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isMobile && isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, isMobile]);

  // Resize handlers (desktop only)
  React.useEffect(() => {
    if (!isResizing) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isMobile && isResizing) {
        const newWidth = Math.max(320, e.clientX - position.x);
        const newHeight = Math.max(400, e.clientY - position.y);
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, position, isMobile]);

  // Auto scroll to bottom
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send welcome message when chat opens for first time
  React.useEffect(() => {
    if (open && messages.length === 0) {
      const welcomeMsg = (mode === 'admin')
        ? (
          isMobile
            ? `🤖 AI Super Admin — quick tips:\n• /help • /errors list • /sql <query>`
            : `🤖 **AI Super Admin Assistant** - Full System Access\n\nSaya punya akses lengkap ke database dan sistem. Type / for command suggestions, or ask me to analyze errors and run SQL queries.`
        )
        : (
          isMobile
            ? `👋 Halo — tanya tentang OSIS, event, atau sekbid. Contoh: "Event apa"` 
            : `👋 **Halo! Selamat datang di OSIS SMK Informatika Fithrah Insani**\n\nSaya AI Assistant yang siap membantu Anda! Tanyakan tentang OSIS, event, pendaftaran, atau sekbid.`
        );

      setMessages([{ role: 'assistant', content: welcomeMsg }]);
    }
  }, [open, mode, isMobile]);

  const clearChat = () => {
    setMessages([]);
    setSessionId(null);
    localStorage.removeItem('livechat_state');
    const welcomeMsg = mode === 'admin' 
      ? `👋 Halo Admin! Saya AI Ops Assistant.\n\nSaya bisa membantu:\n• Analisa error sistem\n• Jalankan perintah terminal\n• Kelola konfigurasi\n• Terapkan perbaikan otomatis\n\nKetik /help untuk daftar lengkap perintah.\nKetik /clear untuk hapus riwayat chat.`
      : `👋 Halo! Saya AI Assistant OSIS SMK Informatika.\n\nSaya siap membantu menjawab pertanyaan tentang:\n• Struktur organisasi OSIS\n• Kegiatan dan event\n• Pendaftaran anggota\n• Kontak dan informasi umum\n\nSilakan ajukan pertanyaan Anda!`;
    
    setTimeout(() => setMessages([{ role: 'assistant', content: welcomeMsg }]), 100);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP.');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran file terlalu besar. Maksimal 10MB.');
      return;
    }

    // Compress image if needed
    const compressImage = (file: File, maxSizeMB: number = 4): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;
            
            // Reduce dimensions if too large
            let width = img.width;
            let height = img.height;
            const maxDimension = 2048;
            
            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = (height / width) * maxDimension;
                width = maxDimension;
              } else {
                width = (width / height) * maxDimension;
                height = maxDimension;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            // Try different quality levels to hit target size
            let quality = 0.85;
            let result = canvas.toDataURL('image/jpeg', quality);
            
            while (result.length > maxSizeMB * 1024 * 1024 * 1.37 && quality > 0.1) {
              quality -= 0.1;
              result = canvas.toDataURL('image/jpeg', quality);
            }
            
            resolve(result);
          };
          img.onerror = reject;
          img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    try {
      const base64 = await compressImage(file);
      setUploadedImage(base64);
      setUploadedFileName(file.name);
    } catch (error) {
      console.error('Compression error:', error);
      alert('Gagal memproses gambar.');
    }
  };

  const removeUploadedImage = () => {
    setUploadedImage(null);
    setUploadedFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const send = async () => {
    if (!input.trim() && !uploadedImage) return;
    const content = input.trim();
    
    // Handle /clear command
    if (content === '/clear') {
      setInput('');
      clearChat();
      return;
    }
    
    const userMessage = uploadedImage 
      ? `${content || 'Lihat gambar ini'}`
      : content;
    
    setInput('');
    const currentImage = uploadedImage;
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: userMessage,
      image: currentImage || undefined
    }]);
    removeUploadedImage();
    setLoading(true);
    
    try {
      // If there's an image, use vision API first
      if (currentImage) {
        const visionRes = await fetch('/api/ai/vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: currentImage,
            question: content || 'Analisis gambar ini dan kenali jika ada wajah orang yang mirip dengan anggota OSIS',
            provider,
          })
        });

        const visionData = await visionRes.json();
        
        if (visionRes.ok) {
          setMessages(prev => [...prev, { role: 'assistant', content: visionData.result }]);
          setLoading(false);
          return;
        } else {
          // Fallback to regular chat with image description
          console.error('[Vision Error]:', visionData.error);
        }
      }

      // Regular chat without image or vision fallback
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages.map(m => ({ role: m.role, content: m.content, image: m.image })), { 
            role: 'user', 
            content: userMessage,
            image: currentImage
          }],
          sessionId,
          mode,
          provider,
        })
      });

      const text = await res.text();
      if (text.trim().startsWith('<')) {
        console.error('[LiveChat] HTML response instead of JSON:', text.substring(0, 200));
        setMessages(prev => [...prev, { role: 'assistant', content: '❌ Server error - received HTML response instead of JSON' }]);
        setLoading(false);
        return;
      }

      const json = JSON.parse(text);
      if (res.ok) {
        if (json.sessionId) setSessionId(json.sessionId);
        setMessages(prev => [...prev, { role: 'assistant', content: json.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${json.error}: ${json.details || ''}` }]);
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ Network error: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const pickSuggestion = (index: number) => {
    if (index < 0 || index >= filteredSuggestions.length) return;
    const s = filteredSuggestions[index];
    const appendSpace = s.cmd.endsWith(' ') ? '' : ' ';
    setInput(`${s.cmd}${appendSpace}`);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const openPalette = () => {
    if (!suggestionsEnabled) return;
    setPaletteOpen(true);
    setShowSuggestions(false);
    setInput(prev => prev || '/');
    setSelectedIndex(0);
  };

  const closePalette = () => {
    setPaletteOpen(false);
    setSelectedIndex(-1);
  };

  const paletteCommands = React.useMemo(() => {
    if (!paletteOpen) return [] as Command[];
    const base = (mode === 'admin') ? adminCommands : [];
    const query = input.startsWith('/') ? input.slice(1).trim() : input.trim();
    if (!query) return base;
    const ranked: { c: Command; score: number }[] = [];
    for (const c of base) {
      const score = fuzzyMatch(query, c.cmd.replace('/', ''));
      if (score !== null) ranked.push({ c, score });
    }
    ranked.sort((a,b)=> b.score - a.score || a.c.cmd.localeCompare(b.c.cmd));
    return ranked.map(r=> r.c).slice(0, 20);
  }, [paletteOpen, input, mode, adminCommands]);

  const handleCommandSelect = (command: Command) => {
    const tpl = command.template || command.cmd;
    setInput(tpl + (tpl.endsWith(' ') ? '' : (tpl.includes('<') ? ' ' : '')));
    setPaletteOpen(false);
    setShowSuggestions(false);
    requestAnimationFrame(() => {
      if (inputRef.current) {
        const idx = tpl.indexOf('<');
        if (idx >= 0) {
          inputRef.current.focus();
          inputRef.current.setSelectionRange(idx, tpl.length);
        } else {
          inputRef.current.focus();
          inputRef.current.setSelectionRange(tpl.length, tpl.length);
        }
      }
    });
  };

  // Listen to global open/close events
  React.useEffect(() => {
    const openHandler = () => setOpen(true);
    const closeHandler = () => setOpen(false);
    window.addEventListener('open-live-chat', openHandler as EventListener);
    window.addEventListener('close-live-chat', closeHandler as EventListener);
    return () => {
      window.removeEventListener('open-live-chat', openHandler as EventListener);
      window.removeEventListener('close-live-chat', closeHandler as EventListener);
    };
  }, []);

  // Detect mobile viewport to render bottom-sheet style chat
  React.useEffect(() => {
    const check = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth <= 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const content = (
    <>
      {/* 🎨 DYNAMIC CSS INJECTION - Apply custom design from database */}
      {customDesignCSS && (
        <style dangerouslySetInnerHTML={{ __html: customDesignCSS }} />
      )}
      
      {/* ═══════════════════════════════════════════════════════════════════════════
          🎯 FLOATING BUTTON - Elegant Premium Design
          ═══════════════════════════════════════════════════════════════════════════ */}
      {showFloating && !open && (
        <button
          onClick={() => setOpen(true)}
          style={{ 
            position: 'fixed', 
            bottom: isMobile ? '1rem' : '1.5rem', 
            right: isMobile ? '1rem' : '1.5rem', 
            zIndex: 2147483647 
          }}
          className={`group flex items-center justify-center ${isMobile ? 'w-14 h-14' : 'w-14 h-14'} rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all duration-300 ease-out`}
          aria-label="Open AI Chat"
        >
          <FaComments className="text-white drop-shadow-sm" size={isMobile ? 22 : 24} />
          {/* Pulse animation ring */}
          <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 animate-ping opacity-20" />
        </button>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          💬 CHAT WINDOW - Elegant Minimalist Responsive
          ═══════════════════════════════════════════════════════════════════════════ */}
      {open && (
        <div 
          ref={dragRef}
          style={{ 
            position: 'fixed',
            ...(isMobile ? {
              bottom: 0,
              left: 0,
              right: 0,
              width: '100%',
              height: '75vh',
              maxHeight: '75vh',
              borderRadius: '20px 20px 0 0',
            } : isMaximized ? {
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              borderRadius: 0,
            } : {
              top: position.y,
              left: position.x,
              width: `${size.width}px`,
              height: isMinimized ? 'auto' : `${size.height}px`,
              minWidth: '360px',
              maxWidth: '90vw',
              borderRadius: '20px',
            }),
            zIndex: 2147483647,
          }}
          className={`bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-black/20 dark:shadow-black/40 border border-white/20 dark:border-slate-700/50 flex flex-col overflow-hidden ${isMobile ? 'rounded-t-3xl' : isMaximized ? '' : 'rounded-3xl'} ${!isMobile && !isDragging ? 'transition-all duration-300 ease-out' : ''}`}
        >
          {/* ═══════════════════════════════════════════════════════════════════
              📌 HEADER - Clean & Modern
              ═══════════════════════════════════════════════════════════════════ */}
          <div 
            className={`flex items-center justify-between px-4 ${isMobile ? 'py-3 min-h-[56px]' : 'py-3 min-h-[60px]'} border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-white/80 to-slate-50/80 dark:from-slate-900/80 dark:to-slate-800/80 backdrop-blur-xl flex-shrink-0 ${!isMobile && !isMaximized ? 'cursor-move select-none' : ''}`}
            onMouseDown={(e) => {
              if (!isMobile && !isMaximized && e.button === 0) {
                const target = e.target as HTMLElement;
                if (target === e.currentTarget || target.closest('.pointer-events-none')) {
                  setIsDragging(true);
                  setDragStart({
                    x: e.clientX - position.x,
                    y: e.clientY - position.y,
                  });
                }
              }
            }}
          > 
            <div className="flex items-center gap-3 pointer-events-none min-w-0 flex-shrink">
              {/* AI Avatar with gradient */}
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                  <FaRobot className="text-white text-lg" />
                </div>
                {/* Online indicator */}
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white dark:border-slate-900 rounded-full" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="text-sm font-bold text-slate-800 dark:text-white truncate">
                  {mode === 'admin' ? '🔥 Super Admin AI' : 'WEBOSIS AI'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <span>{mode === 'admin' ? 'Premium v5.0' : 'Online'}</span>
                </div>
              </div>
            </div>
            
            {/* Header Controls */}
            <div className="flex items-center gap-0.5 pointer-events-auto flex-shrink-0">
              {/* Forward Message Button (Public only) */}
              {mode === 'public' && (
                <button
                  onClick={() => setShowForwardModal(true)}
                  className="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Kirim Pesan ke Admin"
                  title="Kirim Pesan ke Admin/OSIS"
                >
                  <FaEnvelope size={14} />
                </button>
              )}
              
              {/* Design Mode (Admin only) */}
              {mode === 'admin' && !isMobile && (
                <button
                  onClick={() => setShowDesignPreview(!showDesignPreview)}
                  className={`text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 transition p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 ${showDesignPreview ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' : ''}`}
                  aria-label="Design Mode"
                  title="🎨 Design Preview Mode"
                >
                  <FaPalette size={14} />
                </button>
              )}
              
              {!isMobile && (
                <>
                  <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label="Minimize"
                    title="Minimize"
                  ><FaWindowMinimize size={11} /></button>
                  <button
                    onClick={() => setIsMaximized(!isMaximized)}
                    className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label={isMaximized ? "Restore" : "Maximize"}
                    title={isMaximized ? "Restore" : "Maximize"}
                  >{isMaximized ? <FaWindowRestore size={12} /> : <FaWindowMaximize size={12} />}</button>
                </>
              )}
              <button
                onClick={clearChat}
                className="text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Clear Chat"
                title="Clear Chat"
              ><FaTrash size={12} /></button>
              {!isMinimized && !isMobile && (
                <select
                  value={provider}
                  onChange={e=> setProvider(e.target.value as any)}
                  className="text-[10px] px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 ml-1"
                  title="AI Provider"
                >
                  <option value="auto">Auto</option>
                  <option value="anthropic">Claude</option>
                  <option value="gemini">Gemini</option>
                  <option value="openai">GPT</option>
                </select>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 ml-1"
                aria-label="Close Chat"
              ><FaTimes size={16} /></button>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              📨 MESSAGE FORWARD MODAL
              ═══════════════════════════════════════════════════════════════════ */}
          {showForwardModal && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <FaEnvelope className="text-indigo-500" />
                    Kirim Pesan
                  </h3>
                  <button onClick={() => setShowForwardModal(false)} className="text-slate-400 hover:text-slate-600">
                    <FaTimes />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2 block">Kirim ke:</label>
                    <div className="flex gap-2">
                      {(['osis', 'admin', 'super_admin'] as ForwardTarget[]).map((target) => (
                        <button
                          key={target}
                          onClick={() => setForwardTarget(target)}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                            forwardTarget === target
                              ? 'bg-indigo-500 text-white'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                          }`}
                        >
                          {target === 'osis' ? '🏫 OSIS' : target === 'admin' ? '👤 Admin' : '👑 Super Admin'}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2 block">Pesan:</label>
                    <textarea
                      value={forwardMessage}
                      onChange={(e) => setForwardMessage(e.target.value)}
                      placeholder="Tulis pesan Anda di sini..."
                      className="w-full h-24 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                  
                  <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={forwardUrgent}
                      onChange={(e) => setForwardUrgent(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-red-500 focus:ring-red-400"
                    />
                    <span>🚨 Tandai sebagai Urgent</span>
                  </label>
                  
                  <button
                    onClick={async () => {
                      if (forwardMessage.trim()) {
                        const success = await forwardToAdmin(forwardTarget, forwardMessage, forwardUrgent);
                        if (success) {
                          setMessages(prev => [...prev, {
                            role: 'assistant',
                            content: `✅ Pesan Anda telah dikirim ke ${forwardTarget === 'osis' ? 'OSIS' : forwardTarget === 'admin' ? 'Admin' : 'Super Admin'}. Mereka akan segera merespons!`,
                            isForward: true,
                            forwardTarget
                          }]);
                          setForwardMessage('');
                          setShowForwardModal(false);
                        }
                      }
                    }}
                    disabled={!forwardMessage.trim()}
                    className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:from-slate-400 disabled:to-slate-500 text-white font-medium rounded-xl transition shadow-lg shadow-indigo-500/30 disabled:shadow-none flex items-center justify-center gap-2"
                  >
                    <FaPaperPlane />
                    Kirim Pesan
                  </button>
                </div>
                
                {forwardSent && (
                  <div className="mt-4 p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm flex items-center gap-2">
                    <FaCheck /> Pesan terkirim!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              🎨 DESIGN PREVIEW PANEL (Super Admin)
              ═══════════════════════════════════════════════════════════════════ */}
          {showDesignPreview && mode === 'admin' && designPreview && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <FaPalette className="text-purple-500" />
                    Design Preview
                  </h3>
                  <button onClick={() => setShowDesignPreview(false)} className="text-slate-400 hover:text-slate-600">
                    <FaTimes />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-xl">
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">Component: {designPreview.component}</div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
                      {/* Preview would render here */}
                      <div className="text-center text-slate-400">Preview Area</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDesignPreview(false)}
                      className="flex-1 py-2 px-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition"
                    >
                      Batal
                    </button>
                    <button
                      onClick={applyDesignChange}
                      className="flex-1 py-2 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:from-purple-600 hover:to-pink-600 transition shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2"
                    >
                      <FaMagic />
                      Terapkan Design
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              💬 MESSAGES AREA - Elegant & Responsive
              ═══════════════════════════════════════════════════════════════════ */}
          {!isMinimized && (
            <>
              <div className={`flex-1 ${isMobile ? 'px-3 py-3' : 'px-4 py-4'} space-y-3 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-300/50 dark:scrollbar-thumb-slate-700/50 scrollbar-track-transparent`}>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl shadow-sm ${
                    m.role === 'user' 
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-br-md' 
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 rounded-bl-md'
                  } ${isMobile ? 'text-[13px] px-3.5 py-2.5' : 'text-sm px-4 py-3'}`}
                  style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                >
                  {m.image && (
                    <div className="mb-2">
                      <img 
                        src={m.image} 
                        alt="Uploaded" 
                        className="max-w-full max-h-64 rounded-lg border border-slate-300/50 dark:border-slate-600/50"
                      />
                    </div>
                  )}
                  {/* Render generated images from /generate command */}
                  {m.role === 'assistant' && m.content.includes('![Generated Image]') && (() => {
                    const imageUrlMatch = m.content.match(/!\[Generated Image\]\((https?:\/\/[^\)]+)\)/);
                    if (imageUrlMatch) {
                      const imageUrl = imageUrlMatch[1];
                      return (
                        <div className="mb-3">
                          <img 
                            src={imageUrl} 
                            alt="AI Generated" 
                            className="max-w-full rounded-lg border border-indigo-300/50 dark:border-indigo-600/50 shadow-md"
                          />
                          <div className="mt-2 flex gap-2">
                            <a 
                              href={imageUrl} 
                              download="generated-image.png"
                              className="text-xs px-3 py-1 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-800 dark:hover:bg-indigo-700 text-indigo-900 dark:text-indigo-100 rounded-md transition"
                            >
                              📥 Download
                            </a>
                            <a 
                              href={imageUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 rounded-md transition"
                            >
                              🔗 Open
                            </a>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  {/* Render text content (strip markdown image syntax for cleaner display) */}
                  {m.content.replace(/!\[Generated Image\]\(https?:\/\/[^\)]+\)/g, '').trim()}
                  
                  {/* 🔗 SMART QUICK LINKS - Premium Feature */}
                  {m.role === 'assistant' && (() => {
                    const quickLinks = detectQuickLinks(m.content);
                    if (quickLinks.length > 0) {
                      return (
                        <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-600/40">
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                            <FaExternalLinkAlt size={8} /> Quick Links
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {quickLinks.map((link, idx) => (
                              <Link
                                key={idx}
                                href={link.path}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] rounded-lg bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-700/50 hover:from-indigo-100 hover:to-blue-100 dark:hover:from-indigo-800/40 dark:hover:to-blue-800/40 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-200 shadow-sm hover:shadow group"
                                title={link.description}
                              >
                                <span className="opacity-70 group-hover:opacity-100">{link.icon}</span>
                                <span className="font-medium">{link.label}</span>
                                <FaArrowRight size={8} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                              </Link>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  {/* ⚡ QUICK ACTIONS - Follow-up suggestions */}
                  {m.role === 'assistant' && (() => {
                    const quickActions = detectQuickActions(m.content);
                    if (quickActions.length > 0) {
                      return (
                        <div className="mt-2 pt-2 border-t border-slate-100/60 dark:border-slate-700/40">
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 mb-1.5">💡 Tanya lebih lanjut:</div>
                          <div className="flex flex-wrap gap-1">
                            {quickActions.map((action, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setInput(action.action);
                                  // Auto send after small delay
                                  setTimeout(() => {
                                    const sendBtn = document.querySelector('[aria-label="Kirim pesan"]') as HTMLButtonElement;
                                    sendBtn?.click();
                                  }, 100);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                title={action.action}
                              >
                                {action.icon}
                                <span>{action.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            ))}
            {/* Elegant Loading Indicator */}
            {loading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <FaRobot className="text-white text-sm animate-pulse" />
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            {/* 🎨 Design Loading - Fancy Animation */}
            {designLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center flex-shrink-0 animate-pulse">
                  <FaPalette className="text-white text-sm" />
                </div>
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl rounded-bl-md px-5 py-4 shadow-lg border-2 border-indigo-200/60 dark:border-indigo-700/60">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full border-4 border-indigo-200 border-t-indigo-500 animate-spin" />
                      <FaMagic className="absolute inset-0 m-auto text-indigo-500 text-xs" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">✨ Mendesain...</p>
                      <p className="text-xs text-indigo-500/70">AI sedang membuat preview</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* 🎨 Design Applying - Progress Animation */}
            {designApplying && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                  <FaCog className="text-white text-sm animate-spin" />
                </div>
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl rounded-bl-md px-5 py-4 shadow-lg border-2 border-emerald-200/60 dark:border-emerald-700/60">
                  <div className="flex items-center gap-3">
                    <div className="space-y-1">
                      <div className="h-1.5 w-32 bg-emerald-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-[progress_1.5s_ease-in-out_infinite]" style={{ width: '60%' }} />
                      </div>
                      <div className="h-1.5 w-24 bg-emerald-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full animate-[progress_2s_ease-in-out_infinite]" style={{ width: '80%' }} />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">🚀 Menerapkan Design...</p>
                      <p className="text-xs text-emerald-500/70">Sedang update komponen</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              ⌨️ INPUT AREA - Modern & Clean
              ═══════════════════════════════════════════════════════════════════ */}
          <div className={`${isMobile ? 'p-3' : 'p-4'} border-t border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-t from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-800/50 backdrop-blur-xl flex-shrink-0`}>
            {/* Image Preview */}
            {uploadedImage && (
              <div className="relative inline-block max-w-xs mb-3">
                <img 
                  src={uploadedImage} 
                  alt={uploadedFileName} 
                  className="max-h-28 rounded-xl border-2 border-indigo-200 dark:border-indigo-700 shadow-md"
                />
                <button
                  onClick={removeUploadedImage}
                  className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-rose-600 shadow-lg transition transform hover:scale-110"
                  aria-label="Remove image"
                >
                  <FaTimes size={10} />
                </button>
              </div>
            )}

            {/* Input Row */}
            <div className="flex items-end gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              {/* Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all duration-200 flex items-center justify-center flex-shrink-0 hover:scale-105"
                title="Upload gambar"
                aria-label="Upload file"
              >
                <FaImage size={16} />
              </button>
              
              {/* Text Input */}
              <div className="relative flex-1 min-w-0">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e)=>{ setInput(e.target.value); if (paletteOpen && e.target.value.trim() === '') { setInput('/'); } }}
                  onKeyDown={(e)=>{
                    if (e.key === 'Escape' && paletteOpen) { e.preventDefault(); closePalette(); return; }
                    if ((e.key === '/' && input === '') || (e.key === 'k' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); openPalette(); return; }
                    if (paletteOpen) {
                      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i=> Math.min((i<0?0:i)+1, paletteCommands.length-1)); return; }
                      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i=> Math.max((i<=0?0:i-1), 0)); return; }
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (selectedIndex >=0 && selectedIndex < paletteCommands.length) { handleCommandSelect(paletteCommands[selectedIndex]); } else { closePalette(); } return; }
                      if (e.key === 'Tab') { e.preventDefault(); if (selectedIndex >=0 && selectedIndex < paletteCommands.length) { handleCommandSelect(paletteCommands[selectedIndex]); } return; }
                      return;
                    }
                    if (suggestionsEnabled && showSuggestions) {
                      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex((i)=> Math.min((i<0?0:i)+1, filteredSuggestions.length-1)); return; }
                      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex((i)=> Math.max((i<=0?0:i-1), 0)); return; }
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (selectedIndex >= 0) { pickSuggestion(selectedIndex); } else { send(); } return; }
                      if (e.key === 'Escape') { setShowSuggestions(false); setSelectedIndex(-1); return; }
                    } else if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send();
                      return;
                    }
                  }}
                  rows={1}
                  placeholder={mode === 'admin' ? '💬 Ketik pesan atau / untuk perintah...' : '💬 Tanyakan sesuatu...'}
                  className={`w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white ${isMobile ? 'text-base' : 'text-sm'} focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-400/20 caret-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none transition-all duration-200`}
                  style={{ height: '44px', maxHeight: '120px' }}
                />

              {paletteOpen && suggestionsEnabled && (
                <div className="absolute bottom-full mb-2 left-0 w-full max-h-72 overflow-auto rounded-lg border border-slate-300 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 shadow-xl z-[2147483647] backdrop-blur-sm">
                  <div className="sticky top-0 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span>⚡ Perintah ({paletteCommands.length})</span>
                    <button onClick={closePalette} className="text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 text-xs">Esc</button>
                  </div>
                  {paletteCommands.map((c, idx) => (
                    <button
                      key={c.cmd+idx}
                      type="button"
                      onClick={()=>handleCommandSelect(c)}
                      className={`w-full text-left px-3 py-2 text-sm flex flex-col gap-1 border-b border-slate-100 dark:border-slate-800 ${idx===selectedIndex? 'bg-indigo-100 dark:bg-indigo-900/40' : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-700 dark:text-slate-300 text-xs">{c.template || c.cmd}</span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{c.desc}</span>
                    </button>
                  ))}
                  {paletteCommands.length === 0 && (
                    <div className="px-3 py-4 text-xs text-slate-500">Tidak ada perintah cocok.</div>
                  )}
                  <div className="px-3 py-2 text-[10px] text-slate-500 dark:text-slate-400 flex flex-wrap gap-3">
                    <span><kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">↵</kbd> pilih</span>
                    <span><kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">Esc</kbd> tutup</span>
                    <span><kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">Ctrl+K</kbd> buka</span>
                  </div>
                </div>
              )}

              {suggestionsEnabled && showSuggestions && !paletteOpen && (
                <div className="absolute bottom-full mb-2 left-0 w-full max-h-56 overflow-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl z-[2147483647]">
                  {filteredSuggestions.map((s, idx) => (
                    <button
                      key={s.cmd+idx}
                      type="button"
                      onClick={()=>pickSuggestion(idx)}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-start gap-2 transition ${idx===selectedIndex? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                    >
                      <span className="font-mono text-indigo-600 dark:text-indigo-400">{s.cmd}</span>
                      <span className="text-slate-500 dark:text-slate-400">{s.desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

              {/* Send Button */}
              <button
                onClick={send}
                disabled={loading || (!input.trim() && !uploadedImage)}
                className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:from-slate-300 disabled:to-slate-400 text-white shadow-lg shadow-indigo-500/30 disabled:shadow-none transition-all duration-200 flex items-center justify-center flex-shrink-0 hover:scale-105 disabled:hover:scale-100"
                aria-label="Kirim pesan"
              >
                <FaPaperPlane size={14} />
              </button>
              
              {/* Mobile Provider Select */}
              {isMobile && (
                <select
                  value={provider}
                  onChange={e=> setProvider(e.target.value as any)}
                  className="text-[10px] px-2 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                  title="Provider AI"
                >
                  <option value="auto">Auto</option>
                  <option value="anthropic">Claude</option>
                  <option value="gemini">Gemini</option>
                  <option value="openai">GPT</option>
                </select>
              )}
            </div>
          </div>
            </>
          )}
          
          {/* Resize handle (desktop only) */}
          {!isMobile && !isMaximized && !isMinimized && (
            <div
              className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize opacity-50 hover:opacity-100 transition"
              style={{ borderBottomRightRadius: '20px' }}
              onMouseDown={(e) => {
                e.preventDefault();
                setIsResizing(true);
              }}
            >
              <FaGripVertical className="absolute bottom-1 right-1 text-slate-400 dark:text-slate-500" size={10} />
            </div>
          )}
        </div>
      )}
    </>
  );

  if (!mounted) return null;
  return createPortal(<ChatBoundary>{content}</ChatBoundary>, document.body);
}
