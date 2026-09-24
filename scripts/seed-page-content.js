#!/usr/bin/env node

/**
 * Seed page_content with hardcoded defaults from public pages.
 * Idempotent: only inserts keys that do not exist yet (never overwrites edits).
 *
 * Usage: node scripts/seed-page-content.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/** @type {Record<string, { content: string, category: string, title?: string, content_type?: string }>} */
const DEFAULTS = {
  // Hero
  home_hero_title: { content: 'OSIS SMK Informatika', category: 'hero' },
  home_hero_subtitle: { content: 'Raveka Sena 2025-2026', category: 'hero' },
  home_hero_description: {
    content: 'Bersama Raveka Sena, kita menjadi pasukan sinar terang yang membawa perubahan positif dan inovasi untuk masa depan gemilang.',
    category: 'hero',
  },

  // Vision (homepage)
  site_vision_text: { content: 'Menjadi organisasi yang', category: 'vision' },
  site_vision_hl1: { content: 'membersamai terbentuknya', category: 'vision' },
  site_vision_part2: { content: 'karakter siswa yang', category: 'vision' },
  site_vision_hl2: { content: 'KAMIL dan Inovatif', category: 'vision' },
  site_vision_part3: { content: '', category: 'vision' },
  site_vision_hl3: { content: '', category: 'vision' },

  // Goals
  home_goals_title: { content: 'Forum OSIS Kabupaten Bandung Barat', category: 'goals' },
  home_goals_desc: {
    content: 'Kami berkomitmen untuk membentuk generasi yang berakhlak mulia, cerdas, dan mandiri. Melalui kegiatan pendidikan dan pembinaan karakter, kami ingin menciptakan lingkungan belajar yang inspiratif dan produktif bagi seluruh siswa.',
    category: 'goals',
  },
  home_goal1_title: { content: 'Prestasi Akademik', category: 'goals' },
  home_goal1_desc: { content: 'Meningkatkan prestasi akademik siswa melalui program bimbingan dan kompetisi', category: 'goals' },
  home_goal2_title: { content: 'Karakter Islami', category: 'goals' },
  home_goal2_desc: { content: 'Membentuk karakter siswa yang berakhlak mulia berdasarkan nilai-nilai Islam', category: 'goals' },
  home_goal3_title: { content: 'Kepemimpinan', category: 'goals' },
  home_goal3_desc: { content: 'Mengembangkan jiwa kepemimpinan dan kerjasama dalam organisasi', category: 'goals' },
  home_goal4_title: { content: 'Inovasi & Kreativitas', category: 'goals' },
  home_goal4_desc: { content: 'Mendorong inovasi dan kreativitas dalam setiap kegiatan dan program', category: 'goals' },
  home_goal5_title: { content: 'Keunggulan Sekolah', category: 'goals' },
  home_goal5_desc: { content: 'Menjadikan SMK Informatika Fithrah Insani sebagai sekolah unggulan di Kabupaten Bandung Barat', category: 'goals' },
  home_goal6_title: { content: 'Visi 2030', category: 'goals' },
  home_goal6_desc: { content: 'Mewujudkan visi sekolah menjadi lembaga pendidikan Islam terdepan', category: 'goals' },
  home_goals_cta_title: { content: 'Mari Bergabung Bersama Kami', category: 'goals' },
  home_goals_cta_desc: {
    content: 'Wujudkan impian dan cita-cita bersama OSIS SMK Informatika Fithrah Insani',
    category: 'goals',
  },

  // About hero
  about_hero_title1: { content: 'Tentang', category: 'about_hero' },
  about_hero_title2: { content: 'RAVEKA SENA 2025-2026', category: 'about_hero' },
  about_hero_subtitle1: { content: 'Mengenal lebih dekat', category: 'about_hero' },
  about_hero_subtitle2: { content: 'OSIS SMK Informatika - Raveka Sena', category: 'about_hero' },
  about_hero_scroll: { content: 'Scroll untuk menjelajahi', category: 'about_hero' },

  // About story & philosophy (match current Raveka Sena translations)
  about_story_title1: { content: 'Cerita', category: 'about_story' },
  about_story_title2: { content: 'Raveka Sena', category: 'about_story' },
  about_philosophy_title: { content: 'Filosofi Nama OSIS', category: 'about_story' },
  about_philosophy_hl: { content: 'Raveka Sena', category: 'about_story' },
  about_philosophy_part1: { content: 'Nama', category: 'about_story' },
  about_philosophy_name_hl: { content: 'RAVEKA SENA', category: 'about_story' },
  about_philosophy_part2: { content: 'terdiri dari dua kata:', category: 'about_story' },
  about_philosophy_sky_hl: { content: '"Raveka" (sinar terang) dan "Sena" (pasukan)', category: 'about_story' },
  about_philosophy_part3: {
    content: ', yang berarti "pasukan yang menjadi sinar terang".',
    category: 'about_story',
  },
  about_philosophy_desc1: {
    content: 'Filosofi ini mencerminkan semangat OSIS untuk menjadi pasukan yang membawa cahaya perubahan, inovasi, dan inspirasi bagi seluruh siswa SMK Informatika Fithrah Insani. Nama ini juga mencerminkan semangat',
    category: 'about_story',
  },
  about_philosophy_desc2: {
    content: 'untuk seluruh warga sekolah.',
    category: 'about_story',
  },

  // About vision & mission
  about_visimisi_label: { content: 'Visi & Misi', category: 'about_visimisi' },
  about_visimisi_title: { content: 'Arah', category: 'about_visimisi' },
  about_visimisi_title_hl: { content: 'Langkah Kami', category: 'about_visimisi' },
  about_vision_label: { content: 'Visi', category: 'about_visimisi' },
  about_vision_content: {
    content: 'Menjadi organisasi siswa yang unggul, inovatif, dan berkarakter islami dalam membentuk generasi pemimpin masa depan yang berwawasan teknologi dan berjiwa kepemimpinan.',
    category: 'about_visimisi',
  },
  about_mission_label: { content: 'Misi', category: 'about_visimisi' },
  about_mission_1: { content: 'Mengembangkan potensi kepemimpinan siswa melalui berbagai kegiatan organisasi', category: 'about_visimisi' },
  about_mission_2: { content: 'Menumbuhkan kreativitas dan inovasi dalam setiap program kerja', category: 'about_visimisi' },
  about_mission_3: { content: 'Menanamkan nilai-nilai keislaman dalam setiap aktivitas', category: 'about_visimisi' },
  about_mission_4: { content: 'Membangun kerjasama yang solid antar anggota dan stakeholder', category: 'about_visimisi' },

  // About achievements
  about_achievements_label: { content: 'Perjalanan Kami', category: 'about_achievements' },
  about_achievements_title: { content: 'Pencapaian', category: 'about_achievements' },
  about_achievements_title_hl: { content: 'Raveka Sena', category: 'about_achievements' },

  // About values
  about_values_label: { content: 'Nilai-Nilai Kami', category: 'about_values' },
  about_values_title: { content: 'Prinsip', category: 'about_values' },
  about_values_title_hl: { content: 'yang Kami Pegang', category: 'about_values' },
  about_value1_icon: { content: '💡', category: 'about_values' },
  about_value1_name: { content: 'Inovasi', category: 'about_values' },
  about_value1_desc: { content: 'Selalu mencari cara baru dan kreatif dalam setiap kegiatan', category: 'about_values' },
  about_value1_color: { content: 'from-yellow-400 to-orange-500', category: 'about_values' },
  about_value2_icon: { content: '🤝', category: 'about_values' },
  about_value2_name: { content: 'Integritas', category: 'about_values' },
  about_value2_desc: { content: 'Menjunjung tinggi kejujuran dan tanggung jawab', category: 'about_values' },
  about_value2_color: { content: 'from-blue-400 to-indigo-500', category: 'about_values' },
  about_value3_icon: { content: '🌟', category: 'about_values' },
  about_value3_name: { content: 'Keunggulan', category: 'about_values' },
  about_value3_desc: { content: 'Berusaha memberikan yang terbaik dalam setiap aspek', category: 'about_values' },
  about_value3_color: { content: 'from-purple-400 to-pink-500', category: 'about_values' },
  about_value4_icon: { content: '🕌', category: 'about_values' },
  about_value4_name: { content: 'Islami', category: 'about_values' },
  about_value4_desc: { content: 'Berlandaskan nilai-nilai keislaman dalam setiap tindakan', category: 'about_values' },
  about_value4_color: { content: 'from-green-400 to-emerald-500', category: 'about_values' },

  // About CTA
  about_cta_title: { content: 'Bergabung', category: 'about_cta' },
  about_cta_title_hl: { content: 'Bersama Kami', category: 'about_cta' },
  about_cta_desc: {
    content: 'Mari bersama-sama membangun organisasi yang lebih baik dan menciptakan dampak positif bagi sekolah dan masyarakat.',
    category: 'about_cta',
  },
  about_cta_button: { content: 'Daftar Sekarang', category: 'about_cta' },
  about_cta_button2: { content: 'Lihat Info Terkini', category: 'about_cta' },

  // About logo
  about_logo_title: { content: 'FILOSOFI LOGO OSIS', category: 'about_logo' },
  about_logo_subtitle: {
    content: 'OSIS SMK INFORMATIKA FITHRAH INSANI - Setiap elemen dalam logo memiliki filosofi dan makna yang mendalam',
    category: 'about_logo',
  },
  about_logo_alt: { content: 'Logo OSIS SMK Informatika Fithrah Insani', category: 'about_logo' },

  // About team
  about_core_title1: { content: 'Pengurus', category: 'about_team' },
  about_core_title2: { content: 'Inti', category: 'about_team' },
  about_core_subtitle: {
    content: 'Para siswa berdedikasi yang memimpin dan menginspirasi OSIS SMK Informatika',
    category: 'about_team',
  },
  about_sekbid_title1: { content: 'Ketua', category: 'about_team' },
  about_sekbid_title2: { content: 'Koordinator', category: 'about_team' },
  about_sekbid_subtitle: {
    content: 'Pemimpin bidang yang menggerakkan program kerja OSIS',
    category: 'about_team',
  },

  // Footer
  site_school_name: { content: 'SMK Informatika Fithrah Insani', category: 'footer' },
  site_address: {
    content: 'Jl. H. Gofur No. 10 Tanimulya, Ngamprah, Kab. Bandung Barat',
    category: 'footer',
  },
  site_phone: { content: '(022) 87805564', category: 'footer' },
  site_email: { content: 'osissmkinformatika2.fi@gmail.com', category: 'footer' },
  site_copyright: { content: 'OSIS SMK Fithrah Insani - Raveka Sena', category: 'footer' },

  // Timeline achievements (used by /api/public/achievements)
  achievement_1_year: { content: '2024', category: 'about_achievements', content_type: 'text' },
  achievement_1_title: { content: 'Terbentuknya OSIS Raveka Sena', category: 'about_achievements' },
  achievement_1_desc: {
    content: 'OSIS SMK Informatika resmi terbentuk dengan nama Raveka Sena, membawa semangat baru sebagai pasukan sinar terang.',
    category: 'about_achievements',
  },
  achievement_1_icon: { content: '🚀', category: 'about_achievements' },
  achievement_2_year: { content: '2024', category: 'about_achievements' },
  achievement_2_title: { content: 'Peluncuran Website Resmi', category: 'about_achievements' },
  achievement_2_desc: {
    content: 'Website OSIS dengan fitur modern dan interaktif diluncurkan untuk memudahkan komunikasi dan informasi.',
    category: 'about_achievements',
  },
  achievement_2_icon: { content: '💻', category: 'about_achievements' },
  achievement_3_year: { content: '2025', category: 'about_achievements' },
  achievement_3_title: { content: 'Program Kerja Inovatif', category: 'about_achievements' },
  achievement_3_desc: {
    content: 'Meluncurkan berbagai program kerja yang fokus pada pengembangan soft skill dan hard skill siswa.',
    category: 'about_achievements',
  },
  achievement_3_icon: { content: '🎯', category: 'about_achievements' },
};

async function seed() {
  const keys = Object.keys(DEFAULTS);
  console.log(`🔑 Checking ${keys.length} page_content keys...`);

  const { data: existing, error: selectError } = await supabase
    .from('page_content')
    .select('page_key');

  if (selectError) {
    console.error('❌ Failed to read page_content:', selectError.message);
    process.exit(1);
  }

  const existingSet = new Set((existing || []).map((r) => r.page_key));
  const toInsert = keys
    .filter((k) => !existingSet.has(k))
    .map((k) => ({
      page_key: k,
      title: k,
      content: DEFAULTS[k].content,
      category: DEFAULTS[k].category,
      content_type: DEFAULTS[k].content_type || 'text',
      published: true,
      updated_at: new Date().toISOString(),
    }));

  if (toInsert.length === 0) {
    console.log('✅ All keys already exist — no insert needed.');
    return;
  }

  const { error: insertError } = await supabase.from('page_content').insert(toInsert);

  if (insertError) {
    console.error('❌ Insert failed:', insertError.message);
    process.exit(1);
  }

  console.log(`✅ Inserted ${toInsert.length} new keys (skipped ${keys.length - toInsert.length} existing).`);
}

seed().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
