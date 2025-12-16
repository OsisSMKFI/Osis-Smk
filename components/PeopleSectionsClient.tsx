"use client";

import React from 'react';
import { motion, type Variants } from 'framer-motion';
import AnimatedSection from '@/components/AnimatedSection';
import InteractiveMemberCard from '@/components/InteractiveMemberCard';
import MemberStats from '@/components/MemberStats';
import { useTranslation } from '@/hooks/useTranslation';

// Animation variants for staggered grid
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
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

  // Compute ordering keys and prepared JSX groups (move heavy logic out of JSX)
  const orderedKeys: string[] = [];
  for (let n = 1; n <= 6; n++) {
    const k = `num-${n}`;
    if (groups.has(k)) orderedKeys.push(k);
  }
  const otherNumKeys = Array.from(groups.keys())
    .filter(k => k.startsWith('num-') && !orderedKeys.includes(k))
    .sort((a, b) => Number(a.split('-')[1]) - Number(b.split('-')[1]));
  orderedKeys.push(...otherNumKeys);

  const otherKeys = Array.from(groups.keys()).filter(k => !k.startsWith('num-'));
  otherKeys.sort((a, b) => {
    const ma = groupMeta.get(a)!;
    const mb = groupMeta.get(b)!;
    return (ma.label || '').localeCompare(mb.label || '');
  });
  orderedKeys.push(...otherKeys);

  const renderGroups = orderedKeys.map((key) => {
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
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={containerVariants}
      >
        <div className="text-center mb-6">
          <motion.h3 
            className="text-2xl md:text-3xl font-serif font-semibold tracking-tight text-gray-900 dark:text-white"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {label}
          </motion.h3>
          <motion.p 
            className="mt-1 text-sm text-gray-500 dark:text-gray-300"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
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
              <InteractiveMemberCard member={member} delay={i * 100} />
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
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={containerVariants}
        className="mb-20"
      >
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
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
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
        className="mb-20"
      >
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
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
              <InteractiveMemberCard member={member} delay={i * 100} />
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Koordinator Sekbid */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
        className="mb-20"
      >
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
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
              <InteractiveMemberCard member={member} delay={i * 100} />
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Anggota Sekbid */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={containerVariants}
        className="mb-20"
      >
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-rose-600 bg-clip-text text-transparent mb-6">{t('people.sekbidMembers')}</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">{t('people.sekbidMembersDesc')}</p>
        </motion.div>

          <div className="space-y-8">
            {renderGroups}

            {/* Orphaned members: no department and not core team */}
            {orphanedMembers.length > 0 && (
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
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
                      <InteractiveMemberCard member={member} delay={i * 100} />
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {/* Members with no sekbid (appear after sekbid 1..6) */}
            {anggotaNoSek.length > 0 && (
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
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
                      <InteractiveMemberCard member={member} delay={i * 100} />
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="scroll-reveal"
      >
        <MemberStats />
      </motion.section>
    </>
  );
}
