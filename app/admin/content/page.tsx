'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { apiFetch, safeJson } from '@/lib/safeFetch';
import AdminPageShell from '@/components/admin/AdminPageShell';
import { FaEdit, FaSave, FaTimes, FaPlus, FaTrash, FaSearch, FaFilter } from 'react-icons/fa';

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

// Predefined content categories with descriptions
const CONTENT_CATEGORIES = [
  { key: 'about', label: 'Halaman About', description: 'Konten untuk halaman tentang OSIS' },
  { key: 'home', label: 'Halaman Home', description: 'Konten untuk halaman utama' },
  { key: 'about_achievements', label: 'Pencapaian', description: 'Daftar pencapaian OSIS' },
  { key: 'about_principles', label: 'Prinsip', description: 'Prinsip-prinsip OSIS' },
  { key: 'about_story', label: 'Cerita OSIS', description: 'Sejarah dan cerita OSIS' },
  { key: 'general', label: 'Umum', description: 'Konten umum lainnya' },
];

// Predefined content keys for important data
const IMPORTANT_CONTENT_KEYS = [
  { key: 'about_founding_year', category: 'about', title: 'Tahun Berdiri', description: 'Tahun didirikannya OSIS (contoh: 2024)' },
  { key: 'about_story_title', category: 'about_story', title: 'Judul Cerita', description: 'Judul bagian cerita/sejarah OSIS' },
  { key: 'about_story_content', category: 'about_story', title: 'Isi Cerita', description: 'Konten cerita/sejarah OSIS' },
  { key: 'about_philosophy_title', category: 'about', title: 'Judul Filosofi', description: 'Judul bagian filosofi OSIS' },
  { key: 'about_philosophy_content', category: 'about', title: 'Isi Filosofi', description: 'Konten filosofi OSIS' },
  { key: 'achievement_1_title', category: 'about_achievements', title: 'Pencapaian 1 - Judul', description: 'Judul pencapaian pertama' },
  { key: 'achievement_1_description', category: 'about_achievements', title: 'Pencapaian 1 - Deskripsi', description: 'Deskripsi pencapaian pertama' },
  { key: 'achievement_1_year', category: 'about_achievements', title: 'Pencapaian 1 - Tahun', description: 'Tahun pencapaian pertama' },
  { key: 'achievement_2_title', category: 'about_achievements', title: 'Pencapaian 2 - Judul', description: 'Judul pencapaian kedua' },
  { key: 'achievement_2_description', category: 'about_achievements', title: 'Pencapaian 2 - Deskripsi', description: 'Deskripsi pencapaian kedua' },
  { key: 'achievement_2_year', category: 'about_achievements', title: 'Pencapaian 2 - Tahun', description: 'Tahun pencapaian kedua' },
  { key: 'principle_1_title', category: 'about_principles', title: 'Prinsip 1 - Judul', description: 'Judul prinsip pertama' },
  { key: 'principle_1_description', category: 'about_principles', title: 'Prinsip 1 - Deskripsi', description: 'Deskripsi prinsip pertama' },
  { key: 'principle_2_title', category: 'about_principles', title: 'Prinsip 2 - Judul', description: 'Judul prinsip kedua' },
  { key: 'principle_2_description', category: 'about_principles', title: 'Prinsip 2 - Deskripsi', description: 'Deskripsi prinsip kedua' },
  { key: 'principle_3_title', category: 'about_principles', title: 'Prinsip 3 - Judul', description: 'Judul prinsip ketiga' },
  { key: 'principle_3_description', category: 'about_principles', title: 'Prinsip 3 - Deskripsi', description: 'Deskripsi prinsip ketiga' },
  { key: 'home_hero_title', category: 'home', title: 'Hero Title', description: 'Judul utama di homepage' },
  { key: 'home_hero_subtitle', category: 'home', title: 'Hero Subtitle', description: 'Subtitle di homepage' },
  { key: 'home_hero_description', category: 'home', title: 'Hero Description', description: 'Deskripsi di homepage' },
  { key: 'site_visi', category: 'home', title: 'Visi OSIS', description: 'Visi organisasi OSIS' },
  { key: 'site_misi', category: 'home', title: 'Misi OSIS', description: 'Misi organisasi OSIS' },
];

export default function AdminContentPage() {
  const { data: session, status } = useSession();
  const role = ((session?.user as any)?.role || '').toLowerCase();
  // Allow super_admin, admin, and osis to access content management
  const canAccessAdminPanel = ['super_admin', 'admin', 'osis'].includes(role);

  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ContentItem>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContent, setNewContent] = useState({ key: '', title: '', content: '', category: 'general' });

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/admin/login');
      return;
    }
    if (status === 'authenticated') {
      fetchContents();
    }
  }, [status]);

  const fetchContents = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/admin/content');
      if (res.ok) {
        const data = await safeJson(res, { url: '/api/admin/content', method: 'GET' });
        setContents(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch contents:', error);
      setMessage({ type: 'error', text: 'Gagal memuat konten' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: ContentItem) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSave = async () => {
    if (!editForm.id) return;
    
    try {
      setSaving(true);
      const res = await apiFetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Konten berhasil disimpan!' });
        setEditingId(null);
        setEditForm({});
        fetchContents();
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.error || 'Gagal menyimpan' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddContent = async () => {
    if (!newContent.key || !newContent.title) {
      setMessage({ type: 'error', text: 'Key dan Title wajib diisi' });
      return;
    }
    
    try {
      setSaving(true);
      const res = await apiFetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_key: newContent.key,
          title: newContent.title,
          content: newContent.content,
          category: newContent.category,
        }),
      });
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Konten berhasil ditambahkan!' });
        setShowAddForm(false);
        setNewContent({ key: '', title: '', content: '', category: 'general' });
        fetchContents();
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.error || 'Gagal menambah konten' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus konten ini?')) return;
    
    try {
      const res = await apiFetch(`/api/admin/content?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Konten berhasil dihapus' });
        fetchContents();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal menghapus' });
    }
  };

  const handleAddPredefined = async (predefined: typeof IMPORTANT_CONTENT_KEYS[0]) => {
    // Check if already exists
    if (contents.find(c => c.key === predefined.key || c.page_key === predefined.key)) {
      setMessage({ type: 'error', text: 'Konten sudah ada' });
      return;
    }
    
    setNewContent({
      key: predefined.key,
      title: predefined.title,
      content: '',
      category: predefined.category,
    });
    setShowAddForm(true);
  };

  // Filter contents
  const filteredContents = contents.filter(item => {
    const matchesSearch = !searchTerm || 
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.key?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get missing important content keys
  const existingKeys = new Set(contents.map(c => c.key || c.page_key));
  const missingImportantKeys = IMPORTANT_CONTENT_KEYS.filter(k => !existingKeys.has(k.key));

  if (status === 'loading' || loading) {
    return (
      <AdminPageShell title="Content Management">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </AdminPageShell>
    );
  }

  if (!canAccessAdminPanel) {
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
            <p className="text-gray-600 dark:text-gray-400">Edit konten seperti Tahun Berdiri, Pencapaian, Prinsip, dll.</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            <FaPlus /> Tambah Konten
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.text}
            <button onClick={() => setMessage(null)} className="float-right">&times;</button>
          </div>
        )}

        {/* Missing Important Keys */}
        {missingImportantKeys.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">⚠️ Konten Penting yang Belum Dibuat:</h3>
            <div className="flex flex-wrap gap-2">
              {missingImportantKeys.slice(0, 10).map(item => (
                <button
                  key={item.key}
                  onClick={() => handleAddPredefined(item)}
                  className="px-3 py-1 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-800 dark:hover:bg-yellow-700 text-yellow-800 dark:text-yellow-200 rounded-full text-sm transition"
                  title={item.description}
                >
                  + {item.title}
                </button>
              ))}
              {missingImportantKeys.length > 10 && (
                <span className="text-yellow-600 text-sm">+{missingImportantKeys.length - 10} lainnya</span>
              )}
            </div>
          </div>
        )}

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari konten..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">Semua Kategori</option>
              {CONTENT_CATEGORIES.map(cat => (
                <option key={cat.key} value={cat.key}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Add Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Tambah Konten Baru</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Key (unik)</label>
                  <input
                    type="text"
                    value={newContent.key}
                    onChange={(e) => setNewContent({ ...newContent, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="contoh: about_founding_year"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Judul</label>
                  <input
                    type="text"
                    value={newContent.title}
                    onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Tahun Berdiri"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategori</label>
                  <select
                    value={newContent.category}
                    onChange={(e) => setNewContent({ ...newContent, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {CONTENT_CATEGORIES.map(cat => (
                      <option key={cat.key} value={cat.key}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Konten</label>
                  <textarea
                    value={newContent.content}
                    onChange={(e) => setNewContent({ ...newContent, content: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Isi konten..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewContent({ key: '', title: '', content: '', category: 'general' });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400"
                >
                  Batal
                </button>
                <button
                  onClick={handleAddContent}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Key</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Judul</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Konten</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Kategori</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredContents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      {searchTerm || filterCategory !== 'all' ? 'Tidak ada konten yang cocok' : 'Belum ada konten. Tambahkan konten baru!'}
                    </td>
                  </tr>
                ) : (
                  filteredContents.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      {editingId === item.id ? (
                        // Edit mode
                        <>
                          <td className="px-4 py-3">
                            <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {item.key || item.page_key}
                            </code>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={editForm.title || ''}
                              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <textarea
                              value={editForm.content || ''}
                              onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                              rows={2}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={editForm.category || 'general'}
                              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            >
                              {CONTENT_CATEGORIES.map(cat => (
                                <option key={cat.key} value={cat.key}>{cat.label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={handleSave}
                                disabled={saving}
                                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                                title="Simpan"
                              >
                                <FaSave />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                title="Batal"
                              >
                                <FaTimes />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        // View mode
                        <>
                          <td className="px-4 py-3">
                            <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {item.key || item.page_key}
                            </code>
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                            {item.title}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-xs truncate">
                            {item.content || <span className="italic text-gray-400">Kosong</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                              {CONTENT_CATEGORIES.find(c => c.key === item.category)?.label || item.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleEdit(item)}
                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                title="Hapus"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats */}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Total: {contents.length} konten | Ditampilkan: {filteredContents.length}
        </div>
      </div>
    </AdminPageShell>
  );
}
