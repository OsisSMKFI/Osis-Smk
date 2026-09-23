'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { apiFetch, safeJson } from '@/lib/safeFetch';
import AdminPageShell from '@/components/admin/AdminPageShell';
import { FaEdit, FaSave, FaTimes, FaSearch, FaEye, FaChevronDown, FaChevronRight } from 'react-icons/fa';

interface ContentItem {
  id: string;
  key: string;
  page_key: string;
  title: string;
  content: string;
  category: string;
  published: boolean;
  updated_at: string;
}

interface SectionConfig {
  id: string;
  title: string;
  description: string;
  icon: string;
  fields: { key: string; label: string; type?: 'text' | 'textarea' | 'emoji' | 'color' }[];
}

const SECTIONS: SectionConfig[] = [
  {
    id: 'hero',
    title: 'Hero Homepage',
    description: 'Judul, subtitle, deskripsi di halaman utama',
    icon: '🏠',
    fields: [
      { key: 'home_hero_title', label: 'Judul Hero', type: 'text' },
      { key: 'home_hero_subtitle', label: 'Subtitle Hero', type: 'text' },
      { key: 'home_hero_description', label: 'Deskripsi Hero', type: 'textarea' },
    ],
  },
  {
    id: 'vision',
    title: 'Vision Card (Homepage)',
    description: 'Teks visi yang ditampilkan di homepage',
    icon: '👁️',
    fields: [
      { key: 'site_vision_text', label: 'Teks Visi (awal)', type: 'textarea' },
      { key: 'site_vision_hl1', label: 'Highlight 1', type: 'text' },
      { key: 'site_vision_part2', label: 'Teks Visi (tengah)', type: 'text' },
      { key: 'site_vision_hl2', label: 'Highlight 2', type: 'text' },
      { key: 'site_vision_part3', label: 'Teks Visi (akhir)', type: 'text' },
      { key: 'site_vision_hl3', label: 'Highlight 3', type: 'text' },
    ],
  },
  {
    id: 'goals',
    title: 'Goals Section (Homepage)',
    description: '6 tujuan OSIS yang ditampilkan di homepage',
    icon: '🎯',
    fields: [
      { key: 'home_goals_title', label: 'Judul Section', type: 'text' },
      { key: 'home_goals_desc', label: 'Deskripsi Section', type: 'textarea' },
      { key: 'home_goal1_title', label: 'Goal 1 - Judul', type: 'text' },
      { key: 'home_goal1_desc', label: 'Goal 1 - Deskripsi', type: 'textarea' },
      { key: 'home_goal2_title', label: 'Goal 2 - Judul', type: 'text' },
      { key: 'home_goal2_desc', label: 'Goal 2 - Deskripsi', type: 'textarea' },
      { key: 'home_goal3_title', label: 'Goal 3 - Judul', type: 'text' },
      { key: 'home_goal3_desc', label: 'Goal 3 - Deskripsi', type: 'textarea' },
      { key: 'home_goal4_title', label: 'Goal 4 - Judul', type: 'text' },
      { key: 'home_goal4_desc', label: 'Goal 4 - Deskripsi', type: 'textarea' },
      { key: 'home_goal5_title', label: 'Goal 5 - Judul', type: 'text' },
      { key: 'home_goal5_desc', label: 'Goal 5 - Deskripsi', type: 'textarea' },
      { key: 'home_goal6_title', label: 'Goal 6 - Judul', type: 'text' },
      { key: 'home_goal6_desc', label: 'Goal 6 - Deskripsi', type: 'textarea' },
      { key: 'home_goals_cta_title', label: 'CTA - Judul', type: 'text' },
      { key: 'home_goals_cta_desc', label: 'CTA - Deskripsi', type: 'textarea' },
    ],
  },
  {
    id: 'about_hero',
    title: 'Hero Halaman About',
    description: 'Judul dan subtitle di halaman Tentang',
    icon: '📖',
    fields: [
      { key: 'about_hero_title1', label: 'Judul 1', type: 'text' },
      { key: 'about_hero_title2', label: 'Judul 2 (Highlight)', type: 'text' },
      { key: 'about_hero_subtitle1', label: 'Subtitle 1', type: 'text' },
      { key: 'about_hero_subtitle2', label: 'Subtitle 2', type: 'text' },
      { key: 'about_hero_scroll', label: 'Teks Scroll', type: 'text' },
    ],
  },
  {
    id: 'about_story',
    title: 'Cerita & Filosofi',
    description: 'Cerita sejarah dan filosofi nama OSIS',
    icon: '📜',
    fields: [
      { key: 'about_story_title1', label: 'Judul Cerita', type: 'text' },
      { key: 'about_story_title2', label: 'Judul Cerita (Highlight)', type: 'text' },
      { key: 'about_philosophy_title', label: 'Judul Filosofi', type: 'text' },
      { key: 'about_philosophy_hl', label: 'Filosofi Highlight', type: 'text' },
      { key: 'about_philosophy_part1', label: 'Filosofi - Kalimat 1', type: 'text' },
      { key: 'about_philosophy_name_hl', label: 'Filosofi - Nama Highlight', type: 'text' },
      { key: 'about_philosophy_part2', label: 'Filosofi - Kalimat 2', type: 'text' },
      { key: 'about_philosophy_sky_hl', label: 'Filosofi - Highlight Langit', type: 'text' },
      { key: 'about_philosophy_part3', label: 'Filosofi - Kalimat 3', type: 'textarea' },
      { key: 'about_philosophy_desc1', label: 'Deskripsi Filosofi 1', type: 'textarea' },
      { key: 'about_philosophy_desc2', label: 'Deskripsi Filosofi 2', type: 'textarea' },
    ],
  },
  {
    id: 'about_visimisi',
    title: 'Visi & Misi (About)',
    description: 'Visi dan misi di halaman Tentang',
    icon: '🌟',
    fields: [
      { key: 'about_visimisi_label', label: 'Label Section', type: 'text' },
      { key: 'about_visimisi_title', label: 'Judul Section', type: 'text' },
      { key: 'about_visimisi_title_hl', label: 'Judul Highlight', type: 'text' },
      { key: 'about_vision_label', label: 'Label Visi', type: 'text' },
      { key: 'about_vision_content', label: 'Isi Visi', type: 'textarea' },
      { key: 'about_mission_label', label: 'Label Misi', type: 'text' },
      { key: 'about_mission_1', label: 'Misi 1', type: 'textarea' },
      { key: 'about_mission_2', label: 'Misi 2', type: 'textarea' },
      { key: 'about_mission_3', label: 'Misi 3', type: 'textarea' },
      { key: 'about_mission_4', label: 'Misi 4', type: 'textarea' },
    ],
  },
  {
    id: 'about_values',
    title: 'Nilai-Nilai (About)',
    description: '4 nilai utama OSIS di halaman Tentang',
    icon: '💎',
    fields: [
      { key: 'about_values_label', label: 'Label Section', type: 'text' },
      { key: 'about_values_title', label: 'Judul Section', type: 'text' },
      { key: 'about_values_title_hl', label: 'Judul Highlight', type: 'text' },
      { key: 'about_value1_icon', label: 'Nilai 1 - Icon', type: 'emoji' },
      { key: 'about_value1_name', label: 'Nilai 1 - Nama', type: 'text' },
      { key: 'about_value1_desc', label: 'Nilai 1 - Deskripsi', type: 'textarea' },
      { key: 'about_value1_color', label: 'Nilai 1 - Warna', type: 'color' },
      { key: 'about_value2_icon', label: 'Nilai 2 - Icon', type: 'emoji' },
      { key: 'about_value2_name', label: 'Nilai 2 - Nama', type: 'text' },
      { key: 'about_value2_desc', label: 'Nilai 2 - Deskripsi', type: 'textarea' },
      { key: 'about_value2_color', label: 'Nilai 2 - Warna', type: 'color' },
      { key: 'about_value3_icon', label: 'Nilai 3 - Icon', type: 'emoji' },
      { key: 'about_value3_name', label: 'Nilai 3 - Nama', type: 'text' },
      { key: 'about_value3_desc', label: 'Nilai 3 - Deskripsi', type: 'textarea' },
      { key: 'about_value3_color', label: 'Nilai 3 - Warna', type: 'color' },
      { key: 'about_value4_icon', label: 'Nilai 4 - Icon', type: 'emoji' },
      { key: 'about_value4_name', label: 'Nilai 4 - Nama', type: 'text' },
      { key: 'about_value4_desc', label: 'Nilai 4 - Deskripsi', type: 'textarea' },
      { key: 'about_value4_color', label: 'Nilai 4 - Warna', type: 'color' },
    ],
  },
  {
    id: 'about_cta',
    title: 'CTA Section (About)',
    description: 'Call to action di akhir halaman Tentang',
    icon: '📢',
    fields: [
      { key: 'about_cta_title', label: 'Judul CTA', type: 'text' },
      { key: 'about_cta_title_hl', label: 'Judul CTA (Highlight)', type: 'text' },
      { key: 'about_cta_desc', label: 'Deskripsi CTA', type: 'textarea' },
      { key: 'about_cta_button', label: 'Tombol Utama', type: 'text' },
      { key: 'about_cta_button2', label: 'Tombol Kedua', type: 'text' },
    ],
  },
  {
    id: 'about_achievements',
    title: 'Pencapaian (About)',
    description: 'Judul section pencapaian di halaman Tentang',
    icon: '🏆',
    fields: [
      { key: 'about_achievements_label', label: 'Label Section', type: 'text' },
      { key: 'about_achievements_title', label: 'Judul Section', type: 'text' },
      { key: 'about_achievements_title_hl', label: 'Judul Highlight', type: 'text' },
    ],
  },
  {
    id: 'about_logo',
    title: 'Filosofi Logo (About)',
    description: 'Judul dan subtitle section filosofi logo',
    icon: '🎨',
    fields: [
      { key: 'about_logo_title', label: 'Judul Section', type: 'text' },
      { key: 'about_logo_subtitle', label: 'Subtitle Section', type: 'text' },
      { key: 'about_logo_alt', label: 'Alt Logo', type: 'text' },
    ],
  },
  {
    id: 'about_team',
    title: 'Tim (About)',
    description: 'Judul section tim inti dan koordinator',
    icon: '👥',
    fields: [
      { key: 'about_core_title1', label: 'Judul Tim Inti', type: 'text' },
      { key: 'about_core_title2', label: 'Judul Tim Inti (Highlight)', type: 'text' },
      { key: 'about_core_subtitle', label: 'Subtitle Tim Inti', type: 'text' },
      { key: 'about_sekbid_title1', label: 'Judul Sekbid', type: 'text' },
      { key: 'about_sekbid_title2', label: 'Judul Sekbid (Highlight)', type: 'text' },
      { key: 'about_sekbid_subtitle', label: 'Subtitle Sekbid', type: 'text' },
    ],
  },
  {
    id: 'footer',
    title: 'Info Kontak (Footer)',
    description: 'Nama sekolah, alamat, telepon, email, copyright',
    icon: '📍',
    fields: [
      { key: 'site_school_name', label: 'Nama Sekolah', type: 'text' },
      { key: 'site_address', label: 'Alamat', type: 'textarea' },
      { key: 'site_phone', label: 'Telepon', type: 'text' },
      { key: 'site_email', label: 'Email', type: 'text' },
      { key: 'site_copyright', label: 'Copyright', type: 'text' },
    ],
  },
];

const DEFAULT_CONTENT: Record<string, string> = {
  home_hero_title: 'OSIS SMK Informatika',
  home_hero_subtitle: 'Raveka Sena 2025-2026',
  home_hero_description: 'Bersama Raveka Sena, kita menjadi pasukan sinar terang yang membawa perubahan positif dan inovasi untuk masa depan gemilang.',
  site_vision_text: 'Menjadi organisasi yang',
  site_vision_hl1: 'membersamai terbentuknya',
  site_vision_part2: 'karakter siswa yang',
  site_vision_hl2: 'KAMIL dan Inovatif',
  site_vision_part3: '',
  site_vision_hl3: '',
  about_hero_title1: 'Tentang',
  about_hero_title2: 'RAVEKA SENA 2025-2026',
  about_hero_subtitle1: 'Mengenal lebih dekat',
  about_hero_subtitle2: 'OSIS SMK Informatika - Raveka Sena',
  about_hero_scroll: 'Scroll untuk menjelajahi',
  about_story_title1: 'Cerita',
  about_story_title2: 'Dirgantara',
  about_philosophy_title: 'Filosofi Nama',
  about_philosophy_hl: 'Dirgantara',
  about_philosophy_part1: 'Nama',
  about_philosophy_name_hl: '"Dirgantara"',
  about_philosophy_part2: 'diambil dari kata dalam bahasa Indonesia yang berarti',
  about_philosophy_sky_hl: '"angkasa" atau "langit"',
  about_philosophy_part3: '. Nama ini mencerminkan visi kami yang tinggi dan luas seperti langit.',
  about_visimisi_label: 'Visi & Misi',
  about_visimisi_title: 'Arah',
  about_visimisi_title_hl: 'Langkah Kami',
  about_vision_label: 'Visi',
  about_mission_label: 'Misi',
  about_values_label: 'Nilai-Nilai Kami',
  about_values_title: 'Prinsip',
  about_values_title_hl: 'yang Kami Pegang',
  about_cta_title: 'Bergabung',
  about_cta_title_hl: 'Bersama Kami',
  about_cta_button: 'Daftar Sekarang',
  about_cta_button2: 'Lihat Info Terkini',
  about_achievements_label: 'Perjalanan Kami',
  about_achievements_title: 'Pencapaian',
  about_achievements_title_hl: 'Raveka Sena',
  about_logo_title: 'FILOSOFI LOGO OSIS',
  about_logo_subtitle: 'OSIS SMK INFORMATIKA FITHRAH INSANI - Setiap elemen dalam logo memiliki filosofi dan makna yang mendalam',
  about_logo_alt: 'Logo OSIS SMK Informatika Fithrah Insani',
  about_core_title1: 'Pengurus',
  about_core_title2: 'Inti',
  about_core_subtitle: 'Para pemimpin yang menggerakkan roda organisasi',
  about_sekbid_title1: 'Koordinator',
  about_sekbid_title2: 'Sekbid',
  about_sekbid_subtitle: 'Para koordinator yang memimpin setiap seksi bidang',
  site_school_name: 'SMK Informatika Fithrah Insani',
  site_address: 'Jl. H. Gofur No. 10 Tanimulya, Ngamprah, Kab. Bandung Barat',
  site_phone: '(022) 87805564',
  site_email: 'osissmkinformatika2.fi@gmail.com',
  site_copyright: 'OSIS SMK Fithrah Insani - Raveka Sena',
};

export default function AdminContentPage() {
  const { data: session, status } = useSession();
  const role = ((session?.user as any)?.role || '').toLowerCase();
  const canAccess = ['super_admin', 'admin', 'osis'].includes(role);

  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'filled' | 'empty'>('all');

  useEffect(() => {
    if (status === 'unauthenticated') redirect('/admin/login');
    if (status === 'authenticated') fetchContents();
  }, [status]);

  const fetchContents = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/admin/content');
      if (res.ok) {
        const data = await safeJson(res, { url: '/api/admin/content', method: 'GET' });
        setContents(Array.isArray(data) ? data : []);
      }
    } catch {
      setMessage({ type: 'error', text: 'Gagal memuat konten' });
    } finally {
      setLoading(false);
    }
  };

  const contentMap = new Map(contents.map(c => [c.key || c.page_key, c]));

  const toggleSection = (id: string) => {
    const next = new Set(expandedSections);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedSections(next);
  };

  const startEdit = (section: SectionConfig) => {
    const values: Record<string, string> = {};
    section.fields.forEach(f => {
      const item = contentMap.get(f.key);
      values[f.key] = item?.content || DEFAULT_CONTENT[f.key] || '';
    });
    setEditValues(values);
    setEditingSection(section.id);
  };

  const cancelEdit = () => {
    setEditingSection(null);
    setEditValues({});
  };

  const saveSection = async (section: SectionConfig) => {
    setSaving(true);
    try {
      const saves = section.fields.map(async (field) => {
        const existing = contentMap.get(field.key);
        const raw = editValues[field.key];
        const value = raw !== undefined ? raw : (existing?.content || DEFAULT_CONTENT[field.key] || '');

        if (existing) {
          if ((existing.content || '') === value) return;
          return apiFetch('/api/admin/content', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: existing.id, content: value }),
          });
        } else if (value !== '') {
          return apiFetch('/api/admin/content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              page_key: field.key,
              title: field.label,
              content: value,
              category: section.id,
            }),
          });
        }
      });

      await Promise.all(saves.filter(Boolean));
      setMessage({ type: 'success', text: `${section.title} berhasil disimpan!` });
      setEditingSection(null);
      setEditValues({});
      fetchContents();
    } catch {
      setMessage({ type: 'error', text: 'Gagal menyimpan' });
    } finally {
      setSaving(false);
    }
  };

  const filteredSections = SECTIONS.filter(s => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return s.title.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.fields.some(f => f.label.toLowerCase().includes(q) || f.key.toLowerCase().includes(q));
  });

  const filledCounts = SECTIONS.map(s => ({
    id: s.id,
    filled: s.fields.filter(f => contentMap.has(f.key) && (contentMap.get(f.key)?.content || '') !== '').length,
    total: s.fields.length,
  }));

  const totalFields = SECTIONS.reduce((a, s) => a + s.fields.length, 0);
  const totalFilled = filledCounts.reduce((a, c) => a + c.filled, 0);

  if (status === 'loading' || loading) {
    return (
      <AdminPageShell title="Content Management">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full" />
        </div>
      </AdminPageShell>
    );
  }

  if (!canAccess) {
    return (
      <AdminPageShell title="Content Management">
        <div className="text-center py-12">
          <p className="text-red-500">Anda tidak memiliki akses ke halaman ini</p>
        </div>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell title="Content Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Kelola Konten Halaman</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Klik bagian untuk mengedit. {totalFilled}/{totalFields} kolom sudah terisi.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
              {totalFilled}/{totalFields} kolom terisi
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg flex items-center justify-between ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="text-lg leading-none">&times;</button>
          </div>
        )}

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Cari bagian..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            <option value="all">Semua Bagian</option>
            <option value="empty">Belum Diisi</option>
            <option value="filled">Sudah Diisi</option>
          </select>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {SECTIONS.slice(0, 8).map(s => {
            const fc = filledCounts.find(f => f.id === s.id)!;
            const pct = Math.round((fc.filled / fc.total) * 100);
            return (
              <button
                key={s.id}
                onClick={() => {
                  toggleSection(s.id);
                  if (editingSection !== s.id) startEdit(s);
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  pct === 100
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : pct > 0
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                } hover:shadow-md`}
              >
                <div className="text-lg mb-1">{s.icon}</div>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{s.title}</div>
                <div className="mt-1.5 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${pct}%` }} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Sections */}
        <div className="space-y-3">
          {filteredSections.map(section => {
            const fc = filledCounts.find(f => f.id === section.id)!;
            const isExpanded = expandedSections.has(section.id);
            const isEditing = editingSection === section.id;
            const pct = Math.round((fc.filled / fc.total) * 100);

            if (filterStatus === 'empty' && pct === 100) return null;
            if (filterStatus === 'filled' && pct === 0) return null;

            return (
              <div key={section.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Section Header */}
                <button
                  onClick={() => {
                    toggleSection(section.id);
                    if (!isEditing) startEdit(section);
                  }}
                  className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition text-left"
                >
                  <span className="text-xl">{section.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">{section.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{section.description}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${pct === 100 ? 'bg-green-100 text-green-700' : pct > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                      {fc.filled}/{fc.total}
                    </span>
                    {isExpanded ? <FaChevronDown className="text-gray-400 text-xs" /> : <FaChevronRight className="text-gray-400 text-xs" />}
                  </div>
                </button>

                {/* Section Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                      {section.fields.map(field => {
                        const existing = contentMap.get(field.key);
                        const value = isEditing
                          ? (editValues[field.key] ?? '')
                          : (existing?.content || DEFAULT_CONTENT[field.key] || '');

                        return (
                          <div key={field.key} className="space-y-1">
                            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                              {field.label}
                              {field.type === 'emoji' && <span className="text-gray-400">(emoji)</span>}
                              {field.type === 'color' && <span className="text-gray-400">(hex)</span>}
                              {existing && <span className="text-green-500 text-[10px]">✓</span>}
                            </label>
                            {isEditing ? (
                              field.type === 'textarea' ? (
                                <textarea
                                  value={value}
                                  onChange={(e) => setEditValues({ ...editValues, [field.key]: e.target.value })}
                                  rows={2}
                                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                />
                              ) : field.type === 'color' ? (
                                <div className="flex gap-2 items-center">
                                  <input
                                    type="color"
                                    value={value || '#facc15'}
                                    onChange={(e) => setEditValues({ ...editValues, [field.key]: e.target.value })}
                                    className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                                  />
                                  <input
                                    type="text"
                                    value={value}
                                    onChange={(e) => setEditValues({ ...editValues, [field.key]: e.target.value })}
                                    className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-mono"
                                    placeholder="#facc15"
                                  />
                                </div>
                              ) : (
                                <input
                                  type="text"
                                  value={value}
                                  onChange={(e) => setEditValues({ ...editValues, [field.key]: e.target.value })}
                                  className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                />
                              )
                            ) : (
                              <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm text-gray-700 dark:text-gray-300 min-h-[30px]">
                                {value || <span className="italic text-gray-400">Belum diisi</span>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {isEditing && (
                      <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <button
                          onClick={cancelEdit}
                          className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1"
                        >
                          <FaTimes /> Batal
                        </button>
                        <button
                          onClick={() => saveSection(section)}
                          disabled={saving}
                          className="px-4 py-1.5 text-sm bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-1 font-medium"
                        >
                          <FaSave /> {saving ? 'Menyimpan...' : 'Simpan'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AdminPageShell>
  );
}
