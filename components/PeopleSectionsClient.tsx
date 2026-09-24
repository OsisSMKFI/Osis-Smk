"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import AnimatedSection from '@/components/AnimatedSection';
import InteractiveMemberCard from '@/components/InteractiveMemberCard';
import MemberStats from '@/components/MemberStats';
import { useTranslation } from '@/hooks/useTranslation';

// Animation variants for staggered grid - optimized for instant appearance
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,  // Very fast stagger
      delayChildren: 0,       // No delay
      when: "beforeChildren",
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "tween",
      duration: 0.25,
      ease: "easeOut",
    },
  },
};

interface MemberProp {
  id: number;
  name: string;
  position: string;
  description: string;
  image: string;
  instagram_username?: string;
  // normalize to undefined for client components
  department?: string;
  departmentId?: number | null;
}

interface Props {
  members: MemberProp[];
}

export default function PeopleSectionsClient({ members }: Props) {
  const { t } = useTranslation();
  // State untuk filter Sekbid: 'all' atau nomor sekbid (1-6)
  const [selectedSekbid, setSelectedSekbid] = useState<'all' | number>('all');
  
  // Role-based detection (robust even if sekbid assigned):
  // Core team roles: Ketua OSIS, Wakil Ketua (OSIS), Sekretaris (1/2), Bendahara (1/2)
  const ketua = members.find(m => /^ketua(\s+osis)?$/i.test(m.position.trim())) || null;

  const isCoreTeamRole = (pos: string) => {
    const p = pos.trim().toLowerCase();
    return (
      /^ketua(\s+osis)?$/i.test(pos) ||
      /^wakil(\s+ketua(\s+osis)?)?$/i.test(pos) ||
      /^sekretaris(\s*\d+)?$/i.test(pos) ||
      /^bendahara(\s*\d+)?$/i.test(pos)
    );
  };

  // Full core team list (excluding Ketua for separate section)
  const pengurusInti = members
    .filter(m => isCoreTeamRole(m.position) && !/^ketua(\s+osis)?$/i.test(m.position))
    .sort((a,b) => a.id - b.id);

  // Koordinator Sekbid: section coordinators
  const koordinatorSekbid = members.filter(m => {
    if (!m.department) return false;
    const pos = (m.position || '').trim().toLowerCase();
    return (
      pos === 'koordinator sekbid' ||
      pos === 'kepala departemen'
    );
  });

  // Anggota Sekbid: have department but are not coordinators nor core team
  const anggotaSekbidFlat = members.filter(m => {
    return m.department &&
      !koordinatorSekbid.some(k => k.id === m.id) &&
      !isCoreTeamRole(m.position);
  });

  // Members without department and not core team (orphaned members)
  const orphanedMembers = members.filter(m => {
    return !m.department && !isCoreTeamRole(m.position);
  });

  // Group anggota per sekbid. Previously the code assumed sekbid IDs 1..6
  // which caused members with different DB IDs (e.g. id=23 but name 'sekbid-5')
  // to be omitted. Instead, detect a numeric order from the department
  // label (e.g. 'sekbid-5' or 'Sekbid 5 - Kesehatan') and use that as the
  // primary ordering key. Fallback to departmentId or raw department text.
  const anggotaNoSek: MemberProp[] = [];
  const groups = new Map<string, MemberProp[]>();
  const groupMeta = new Map<string, { order: number | null; label: string }>();

  anggotaSekbidFlat.forEach((m) => {
    const dept = m.department ?? '';
    // Try to extract a meaningful number from the department label
    const numMatch = dept.match(/(\d{1,2})/);
    const orderNum = numMatch ? Number(numMatch[1]) : null;

    let key: string;
    if (orderNum !== null && !Number.isNaN(orderNum)) {
      key = `num-${orderNum}`;
    } else if (m.departmentId) {
      key = `id-${m.departmentId}`;
    } else if (dept) {
      key = `dept-${dept}`;
    } else {
      anggotaNoSek.push(m);
      return;
    }

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
    if (!groupMeta.has(key)) groupMeta.set(key, { order: orderNum, label: dept || `Sekbid ${m.departmentId ?? ''}` });
  });

  // Compute ordering keys — all numeric sekbid ids sorted ascending (any DB id, not just 1-6)
  const orderedKeys: string[] = [];
  const allNumKeys = Array.from(groups.keys())
    .filter(k => k.startsWith('num-'))
    .sort((a, b) => Number(a.split('-')[1]) - Number(b.split('-')[1]));
  orderedKeys.push(...allNumKeys);

  const otherKeys = Array.from(groups.keys()).filter(k => !k.startsWith('num-'));
  otherKeys.sort((a, b) => {
    const ma = groupMeta.get(a)!;
    const mb = groupMeta.get(b)!;
    return (ma.label || '').localeCompare(mb.label || '');
  });
  orderedKeys.push(...otherKeys);

  // Get available sekbid numbers for filter buttons
  const availableSekbids = orderedKeys
    .filter(k => k.startsWith('num-'))
    .map(k => Number(k.split('-')[1]))
    .filter(n => !isNaN(n));

  // Filter orderedKeys based on selected filter
  const filteredKeys = selectedSekbid === 'all' 
    ? orderedKeys 
    : orderedKeys.filter(k => k === `num-${selectedSekbid}`);

  const renderGroups = filteredKeys.map((key) => {
    const group = groups.get(key) || [];
    group.sort((a, b) => {
      const aOrder = (a as any).display_order ?? 0;
      const bOrder = (b as any).display_order ?? 0;
      return aOrder - bOrder;
    });
    if (!group || group.length === 0) return null;
    const meta = groupMeta.get(key);
    const label = meta?.label ?? (group[0].department ?? key);
    return (
      <motion.div 
        key={`sekbid-${key}`}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="text-center mb-6">
          <motion.h3 
            className="text-2xl md:text-3xl font-serif font-semibold tracking-tight text-gray-900 dark:text-white"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {label}
          </motion.h3>
          <motion.p 
            className="mt-1 text-sm text-gray-500 dark:text-gray-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            {t('people.activeMembers')}
          </motion.p>
        </div>
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={containerVariants}
        >
          {group.map((member, i) => (
            <motion.div key={member.id} variants={itemVariants}>
              <InteractiveMemberCard member={member} delay={0} />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    );
  });

        return (
        <>
      {/* Ketua */}
      <motion.section 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="mb-20"
      >
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 bg-clip-text text-transparent mb-6">{t('people.ketuaOsis')}</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">{t('people.organizationLeader')}</p>
        </motion.div>

        <motion.div 
          className="flex justify-center"
          variants={itemVariants}
        >
          <div className="max-w-md">
            {ketua ? <InteractiveMemberCard member={ketua} isLeader delay={0} /> : (
              <div className="text-center text-gray-500">{t('people.noKetuaData')}</div>
            )}
          </div>
        </motion.div>
      </motion.section>

      {/* Pengurus Inti */}
      <motion.section 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="mb-20"
      >
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent mb-6">{t('people.pengurusInti')}</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">{t('people.coreTeamDesc')}</p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
        >
          {pengurusInti.map((member, i) => (
            <motion.div key={member.id} variants={itemVariants}>
              <InteractiveMemberCard member={member} delay={0} />
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Koordinator Sekbid */}
      <motion.section 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="mb-20"
      >
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 bg-clip-text text-transparent mb-6">{t('people.deptHeadTitle')}</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">{t('people.deptHeadDesc')}</p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={containerVariants}
        >
          {koordinatorSekbid.map((member, i) => (
            <motion.div key={member.id} variants={itemVariants}>
              <InteractiveMemberCard member={member} delay={0} />
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Anggota Sekbid */}
      <motion.section 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="mb-20"
      >
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-rose-600 bg-clip-text text-transparent mb-6">{t('people.sekbidMembers')}</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">{t('people.sekbidMembersDesc')}</p>
        </motion.div>

        {/* Filter Buttons untuk Sekbid */}
        {availableSekbids.length > 1 && (
          <motion.div 
            className="mb-12"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            {/* Elegant Tab Navigation - Responsive */}
            <div className="relative flex justify-center px-4">
              {/* Desktop: Horizontal Tabs */}
              <div className="hidden sm:inline-flex items-center p-1.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-purple-500/10 dark:shadow-purple-500/5 border border-gray-100/50 dark:border-slate-700/50">
                {/* All Tab */}
                <button
                  onClick={() => setSelectedSekbid('all')}
                  className={`relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    selectedSekbid === 'all'
                      ? 'text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {selectedSekbid === 'all' && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 rounded-xl shadow-lg shadow-purple-500/30"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    {t('people.filterAll') || 'Semua'}
                  </span>
                </button>
                
                {/* Divider */}
                <div className="w-px h-6 bg-gray-200 dark:bg-slate-600 mx-1" />
                
                {/* Sekbid Tabs - Desktop */}
                {availableSekbids.map((num, idx) => {
                  const key = `num-${num}`;
                  const meta = groupMeta.get(key);
                  const label = meta?.label || `Sekbid ${num}`;
                  const fullLabel = label;
                  // ⚠️ ICON EMOJI PER SEKBID - SESUAIKAN DI SINI:
                  // Sekbid 1: Keagamaan, Sekbid 2: Kaderisasi, Sekbid 3: Akademik
                  // Sekbid 4: Ekonomi Kreatif, Sekbid 5: Kesehatan, Sekbid 6: Kominfo
                  const icons = ['🕌', '👥', '📖', '💡', '🏥', '💻'];
                  const icon = icons[(num - 1) % icons.length];
                  
                  return (
                    <button
                      key={num}
                      onClick={() => setSelectedSekbid(num)}
                      className={`relative px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                        selectedSekbid === num
                          ? 'text-white'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                      title={fullLabel}
                    >
                      {selectedSekbid === num && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 rounded-xl shadow-lg shadow-purple-500/30"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-1.5">
                        <span className="text-base">{icon}</span>
                        <span>{num}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Mobile: Grid Layout */}
              <div className="sm:hidden w-full max-w-sm">
                <div className="grid grid-cols-4 gap-2 p-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-purple-500/10 dark:shadow-purple-500/5 border border-gray-100/50 dark:border-slate-700/50">
                  {/* All Tab - Mobile */}
                  <button
                    onClick={() => setSelectedSekbid('all')}
                    className={`relative col-span-4 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      selectedSekbid === 'all'
                        ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white shadow-lg shadow-purple-500/30'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      {t('people.filterAll') || 'Semua Sekbid'}
                    </span>
                  </button>
                  
                  {/* Sekbid Tabs - Mobile Grid (2 per row) */}
                  {availableSekbids.map((num) => {
                    const key = `num-${num}`;
                    const meta = groupMeta.get(key);
                    const shortLabel = meta?.label?.split('-')[1]?.trim() || `Sekbid ${num}`;
                    // ⚠️ ICON EMOJI PER SEKBID - SESUAIKAN DI SINI:
                    const icons = ['🕌', '👥', '📖', '💡', '🏥', '💻'];
                    const icon = icons[(num - 1) % icons.length];
                    
                    return (
                      <button
                        key={num}
                        onClick={() => setSelectedSekbid(num)}
                        className={`relative col-span-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
                          selectedSekbid === num
                            ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white shadow-lg shadow-purple-500/30'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <span className="flex items-center justify-center gap-1.5">
                          <span className="text-lg">{icon}</span>
                          <span className="truncate">{shortLabel}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Current Selection Label */}
            <AnimatePresence mode="wait">
              <motion.p
                key={selectedSekbid}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="text-center mt-4 text-sm text-gray-500 dark:text-gray-400"
              >
                {selectedSekbid === 'all' 
                  ? t('people.showingAllSekbid') || 'Menampilkan semua seksi bidang'
                  : `${groupMeta.get(`num-${selectedSekbid}`)?.label || `Sekbid ${selectedSekbid}`}`
                }
              </motion.p>
            </AnimatePresence>
          </motion.div>
        )}

          {/* Animated content area with smooth transitions */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={selectedSekbid}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="space-y-12"
            >
              {renderGroups}

              {/* Orphaned members: only show when filter is 'all' */}
              {selectedSekbid === 'all' && orphanedMembers.length > 0 && (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={containerVariants}
                >
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-semibold text-gray-800 dark:text-white">{t('people.unassignedMembers')}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      {t('people.unassignedMembersDesc')}
                    </p>
                  </div>
                  <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                    variants={containerVariants}
                >
                  {orphanedMembers.map((member, i) => (
                    <motion.div key={member.id} variants={itemVariants}>
                      <InteractiveMemberCard member={member} delay={0} />
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}

              {/* Members with no sekbid: only show when filter is 'all' */}
              {selectedSekbid === 'all' && anggotaNoSek.length > 0 && (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={containerVariants}
                >
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-semibold text-gray-800 dark:text-white">{t('people.otherSekbid')}</h3>
                  </div>
                  <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                    variants={containerVariants}
                  >
                    {anggotaNoSek.map((member, i) => (
                      <motion.div key={member.id} variants={itemVariants}>
                        <InteractiveMemberCard member={member} delay={0} />
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="scroll-reveal"
      >
        <MemberStats />
      </motion.section>
    </>
  );
}
