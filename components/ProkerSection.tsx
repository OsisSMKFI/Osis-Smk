'use client';

import { useState, useEffect } from 'react';
import { apiFetch, safeJson } from '@/lib/safeFetch';
import AnimatedSection from './AnimatedSection';
import { getSekbidIcon } from '@/lib/sekbidIcons';
import { FaCalendar, FaClock, FaCheckCircle, FaSpinner, FaBan, FaArrowRight } from 'react-icons/fa';
import Link from 'next/link';

interface Proker {
  id: string;
  title?: string;
  nama?: string;
  description: string | null;
  sekbid_id: number | null;
  start_date: string | null;
  end_date: string | null;
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled';
  sekbid?: {
    id: number;
    name: string;
  } | null;
}

interface SekbidGroup {
  sekbid_id: number;
  sekbid_name: string;
  programs: Proker[];
  count: number;
}

const STATUS_CONFIG = {
  planned: { label: 'Direncanakan', icon: FaClock, color: 'text-gray-600', bg: 'bg-gray-100' },
  ongoing: { label: 'Berlangsung', icon: FaSpinner, color: 'text-blue-600', bg: 'bg-blue-100' },
  completed: { label: 'Selesai', icon: FaCheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  cancelled: { label: 'Dibatalkan', icon: FaBan, color: 'text-red-600', bg: 'bg-red-100' },
};

const GENERAL_GROUP_ID = 0;

function prokerTitle(p: Proker): string {
  return (p.title || p.nama || '').trim() || 'Program Kerja';
}

function prokerDates(p: Proker): { start_date: string | null; end_date: string | null } {
  if (p.start_date || p.end_date) {
    return { start_date: p.start_date, end_date: p.end_date };
  }
  const waktu = (p as any).waktu;
  if (typeof waktu === 'string' && waktu.includes(' - ')) {
    const [a, b] = waktu.split(' - ');
    return { start_date: a?.trim() || null, end_date: b?.trim() || null };
  }
  return { start_date: null, end_date: null };
}

interface ProkerSectionProps {
  initialProker?: Proker[];
}

function groupProker(proker: Proker[]): SekbidGroup[] {
  const grouped: Record<number, SekbidGroup> = {};
  proker.forEach((p) => {
    const hasSekbid =
      typeof p.sekbid_id === 'number' && Number.isFinite(p.sekbid_id) && p.sekbid_id > 0;
    const key = hasSekbid ? (p.sekbid_id as number) : GENERAL_GROUP_ID;

    if (!grouped[key]) {
      grouped[key] = {
        sekbid_id: key,
        sekbid_name: hasSekbid
          ? p.sekbid?.name || `Sekbid ${key}`
          : 'Umum',
        programs: [],
        count: 0,
      };
    }
    grouped[key].programs.push(p);
    grouped[key].count++;
  });

  return Object.values(grouped).sort((a, b) => {
    if (a.sekbid_id === GENERAL_GROUP_ID) return -1;
    if (b.sekbid_id === GENERAL_GROUP_ID) return 1;
    return a.sekbid_id - b.sekbid_id;
  });
}

export default function ProkerSection({ initialProker }: ProkerSectionProps = {}) {
  const [groupedData, setGroupedData] = useState<SekbidGroup[]>(() =>
    initialProker ? groupProker(initialProker) : []
  );
  const [loading, setLoading] = useState(!initialProker);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialProker) {
      setLoading(false);
      return;
    }
    fetchProker();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProker = async () => {
    try {
      const response = await apiFetch('/api/proker');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await safeJson(response, { url: '/api/proker', method: 'GET' });
      const proker: Proker[] = data.proker || [];
      setGroupedData(groupProker(proker));
      setError(null);
    } catch (err: any) {
      console.error('Error fetching proker:', err);
      setError(err?.message || 'Gagal memuat program kerja');
      setGroupedData([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-spin w-12 h-12 sm:w-16 sm:h-16 border-4 border-yellow-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-center text-gray-600 dark:text-gray-400 text-sm sm:text-base">Memuat program kerja...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
            Gagal memuat program kerja. Coba muat ulang halaman.
          </p>
        </div>
      </section>
    );
  }

  if (groupedData.length === 0) {
    return (
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">Belum ada program kerja yang tersedia.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {groupedData.map((group, idx) => {
          const isGeneral = group.sekbid_id === GENERAL_GROUP_ID;
          const sekbidInfo = isGeneral ? null : getSekbidIcon(group.sekbid_id);
          const Icon = sekbidInfo?.icon;
          const headerBg = sekbidInfo?.bgColor || 'bg-amber-100';
          const borderColor = sekbidInfo
            ? sekbidInfo.color.replace('text-', '')
            : '#f59e0b';

          // Show only first 3 programs per sekbid on homepage
          const displayPrograms = group.programs.slice(0, 3);

          return (
            <AnimatedSection key={group.sekbid_id} delay={0.1 * idx}>
              <div className="mb-12 sm:mb-16 last:mb-0">
                {/* Sekbid Header */}
                <div className={`${headerBg} dark:bg-opacity-20 rounded-2xl p-4 sm:p-6 mb-6 border-l-4`} style={{ borderColor }}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      {Icon && (
                        <div className={`${sekbidInfo?.bgColor} ${sekbidInfo?.color} p-3 sm:p-4 rounded-xl shadow-lg`}>
                          <Icon className="text-3xl sm:text-4xl" />
                        </div>
                      )}
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                          {isGeneral
                            ? group.sekbid_name
                            : `Sekbid ${group.sekbid_id}: ${group.sekbid_name}`}
                        </h2>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                          {group.count} Program Kerja
                        </p>
                      </div>
                    </div>
                    {!isGeneral && (
                      <Link
                        href={`/sekbid/${group.sekbid_id}`}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-yellow-50 dark:hover:bg-gray-700 transition-colors text-sm sm:text-base text-gray-700 dark:text-gray-300 font-semibold"
                      >
                        Lihat Semua <FaArrowRight />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Program Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {displayPrograms.map((program) => {
                    const statusInfo =
                      STATUS_CONFIG[program.status] || STATUS_CONFIG.planned;
                    const StatusIcon = statusInfo.icon;
                    const dates = prokerDates(program);

                    return (
                      <div
                        key={program.id}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden group border border-gray-100 dark:border-gray-700"
                      >
                        {/* Status Badge */}
                        <div className={`${statusInfo.bg} ${statusInfo.color} px-4 py-2 flex items-center gap-2`}>
                          <StatusIcon className="text-sm" />
                          <span className="text-sm font-semibold">{statusInfo.label}</span>
                        </div>

                        <div className="p-6">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
                            {prokerTitle(program)}
                          </h3>

                          {program.description && (
                            <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                              {program.description}
                            </p>
                          )}

                          {/* Dates */}
                          <div className="space-y-2 text-sm">
                            {dates.start_date && (
                              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                <FaCalendar className="text-yellow-600" />
                                <span>Mulai: {formatDate(dates.start_date)}</span>
                              </div>
                            )}
                            {dates.end_date && (
                              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                <FaCalendar className="text-yellow-600" />
                                <span>Selesai: {formatDate(dates.end_date)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </AnimatedSection>
          );
        })}
      </div>
    </section>
  );
}
