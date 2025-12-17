import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { DESIGN_REGISTRY, findComponent } from '@/lib/design-registry';

// ═══════════════════════════════════════════════════════════════════════════════
// ⚡ AI EXECUTE ACTION API v2.0 - Real Action Execution for ALL Components
// ═══════════════════════════════════════════════════════════════════════════════
// This API allows AI to actually execute actions on ANY element on ANY page.
// Actions: apply_design, send_notification, create_element, modify_page, etc.
// ═══════════════════════════════════════════════════════════════════════════════

interface ActionResult {
  success: boolean;
  action: string;
  details: string;
  timestamp: string;
  data?: any;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 COMPREHENSIVE DESIGN TEMPLATES FOR ALL COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════
const DESIGN_TEMPLATES: Record<string, string> = {
  // === CHAT COMPONENTS ===
  chat_input_neumorphism: `
/* Neumorphism Design for Chat Input */
.chat-input-container {
  background: linear-gradient(145deg, #f0f0f3, #cacace);
  border-radius: 16px;
  padding: 12px 16px;
  box-shadow: 
    8px 8px 16px #b8b8bb,
    -8px -8px 16px #ffffff,
    inset 2px 2px 4px rgba(255,255,255,0.5),
    inset -2px -2px 4px rgba(0,0,0,0.05);
  border: none;
  transition: all 0.3s ease;
}

.chat-input-container:focus-within {
  box-shadow: 
    4px 4px 8px #b8b8bb,
    -4px -4px 8px #ffffff,
    inset 4px 4px 8px rgba(0,0,0,0.1),
    inset -4px -4px 8px rgba(255,255,255,0.9);
}

.chat-input {
  background: transparent;
  border: none;
  outline: none;
  font-size: 14px;
  color: #333;
  width: 100%;
  resize: none;
}

.chat-input::placeholder {
  color: #888;
}

.chat-send-button {
  background: linear-gradient(145deg, #4f46e5, #6366f1);
  border: none;
  border-radius: 12px;
  padding: 10px 16px;
  color: white;
  cursor: pointer;
  box-shadow: 
    4px 4px 8px rgba(79, 70, 229, 0.3),
    -2px -2px 6px rgba(255,255,255,0.2);
  transition: all 0.2s ease;
}

.chat-send-button:hover {
  transform: translateY(-2px);
  box-shadow: 
    6px 6px 12px rgba(79, 70, 229, 0.4),
    -2px -2px 8px rgba(255,255,255,0.3);
}

.chat-send-button:active {
  transform: translateY(0);
  box-shadow: 
    inset 2px 2px 4px rgba(0,0,0,0.2),
    inset -2px -2px 4px rgba(255,255,255,0.1);
}
`,

  chat_input_glassmorphism: `
/* Glassmorphism Design for Chat Input */
.chat-input-container {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 16px;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.chat-input-container:focus-within {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.4);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.chat-input {
  background: transparent;
  border: none;
  outline: none;
  font-size: 14px;
  color: #1a1a2e;
  width: 100%;
  resize: none;
}

.chat-send-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  padding: 10px 16px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.chat-send-button:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}
`,

  chat_input_modern_minimal: `
/* Modern Minimal Design for Chat Input */
.chat-input-container {
  background: #ffffff;
  border-radius: 24px;
  padding: 12px 20px;
  border: 2px solid #e5e7eb;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.chat-input-container:focus-within {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.chat-input {
  background: transparent;
  border: none;
  outline: none;
  font-size: 15px;
  color: #1f2937;
  width: 100%;
  resize: none;
  line-height: 1.5;
}

.chat-input::placeholder {
  color: #9ca3af;
}

.chat-send-button {
  background: #6366f1;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.chat-send-button:hover {
  background: #4f46e5;
  transform: scale(1.1);
}
`,

  // === BUTTON COMPONENTS ===
  button_neumorphism: `
/* Neumorphism Buttons */
button, .btn, [data-component="button"] {
  background: linear-gradient(145deg, #f0f0f3, #cacace);
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-weight: 600;
  color: #333;
  box-shadow: 
    6px 6px 12px #b8b8bb,
    -6px -6px 12px #ffffff;
  transition: all 0.3s ease;
  cursor: pointer;
}
button:hover, .btn:hover {
  box-shadow: 
    4px 4px 8px #b8b8bb,
    -4px -4px 8px #ffffff;
}
button:active, .btn:active {
  box-shadow: 
    inset 4px 4px 8px #b8b8bb,
    inset -4px -4px 8px #ffffff;
}
`,

  button_glassmorphism: `
/* Glassmorphism Buttons */
button, .btn, [data-component="button"] {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 12px 24px;
  font-weight: 600;
  color: #1a1a2e;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
}
button:hover, .btn:hover {
  background: rgba(255, 255, 255, 0.35);
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}
`,

  button_modern: `
/* Modern Button Style */
button, .btn, [data-component="button"] {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
  color: white;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
  transition: all 0.2s ease;
  cursor: pointer;
}
button:hover, .btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
}
`,

  // === CARD COMPONENTS ===
  card_neumorphism: `
/* Neumorphism Cards */
.card, [data-component="card"], .panel {
  background: #f0f0f3;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 
    12px 12px 24px #d1d1d4,
    -12px -12px 24px #ffffff;
  border: none;
  transition: all 0.3s ease;
}
.card:hover, .panel:hover {
  box-shadow: 
    8px 8px 16px #d1d1d4,
    -8px -8px 16px #ffffff;
}
`,

  card_glassmorphism: `
/* Glassmorphism Cards */
.card, [data-component="card"], .panel {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}
.card:hover, .panel:hover {
  transform: translateY(-5px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
}
`,

  card_modern: `
/* Modern Cards */
.card, [data-component="card"], .panel {
  background: white;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}
.card:hover, .panel:hover {
  border-color: #6366f1;
  box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.1);
}
`,

  // === HEADER/NAVBAR COMPONENTS ===
  header_neumorphism: `
/* Neumorphism Header */
header, .header, nav.main-nav {
  background: linear-gradient(145deg, #f5f5f7, #e0e0e3);
  padding: 16px 24px;
  box-shadow: 
    0 8px 16px #d1d1d4,
    0 -4px 8px #ffffff;
  border: none;
}
header a, .header a, nav a {
  color: #333;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.2s ease;
}
header a:hover, .header a:hover, nav a:hover {
  background: rgba(0,0,0,0.05);
  box-shadow: 
    inset 2px 2px 4px #d1d1d4,
    inset -2px -2px 4px #ffffff;
}
`,

  header_glassmorphism: `
/* Glassmorphism Header */
header, .header, nav.main-nav {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 16px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
}
header a, .header a, nav a {
  color: #1a1a2e;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.2s ease;
}
header a:hover, .header a:hover, nav a:hover {
  background: rgba(255, 255, 255, 0.4);
}
`,

  header_modern: `
/* Modern Header */
header, .header, nav.main-nav {
  background: white;
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
header a, .header a, nav a {
  color: #374151;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.15s ease;
}
header a:hover, .header a:hover, nav a:hover {
  color: #6366f1;
  background: rgba(99, 102, 241, 0.05);
}
`,

  // === INPUT/FORM COMPONENTS ===
  input_neumorphism: `
/* Neumorphism Inputs */
input, textarea, select, .input {
  background: #f0f0f3;
  border: none;
  border-radius: 12px;
  padding: 14px 18px;
  font-size: 15px;
  color: #333;
  box-shadow: 
    inset 4px 4px 8px #d1d1d4,
    inset -4px -4px 8px #ffffff;
  transition: all 0.2s ease;
  outline: none;
}
input:focus, textarea:focus, select:focus, .input:focus {
  box-shadow: 
    inset 6px 6px 12px #d1d1d4,
    inset -6px -6px 12px #ffffff,
    0 0 0 3px rgba(99, 102, 241, 0.2);
}
input::placeholder, textarea::placeholder {
  color: #888;
}
`,

  input_glassmorphism: `
/* Glassmorphism Inputs */
input, textarea, select, .input {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 14px 18px;
  font-size: 15px;
  color: #1a1a2e;
  transition: all 0.2s ease;
  outline: none;
}
input:focus, textarea:focus, select:focus, .input:focus {
  background: rgba(255, 255, 255, 0.35);
  border-color: rgba(99, 102, 241, 0.5);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}
`,

  input_modern: `
/* Modern Inputs */
input, textarea, select, .input {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  padding: 14px 18px;
  font-size: 15px;
  color: #1f2937;
  transition: all 0.2s ease;
  outline: none;
}
input:focus, textarea:focus, select:focus, .input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}
input::placeholder, textarea::placeholder {
  color: #9ca3af;
}
`,

  // === MODAL COMPONENTS ===
  modal_neumorphism: `
/* Neumorphism Modals */
.modal, .dialog, [role="dialog"] {
  background: #f0f0f3;
  border-radius: 24px;
  padding: 32px;
  box-shadow: 
    20px 20px 40px #b8b8bb,
    -20px -20px 40px #ffffff;
  border: none;
}
`,

  modal_glassmorphism: `
/* Glassmorphism Modals */
.modal, .dialog, [role="dialog"] {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  border-radius: 24px;
  padding: 32px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
`,

  modal_modern: `
/* Modern Modals */
.modal, .dialog, [role="dialog"] {
  background: white;
  border-radius: 16px;
  padding: 32px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
`,

  // === SIDEBAR COMPONENTS ===
  sidebar_neumorphism: `
/* Neumorphism Sidebar */
.sidebar, aside, [data-component="sidebar"] {
  background: linear-gradient(145deg, #f5f5f7, #e0e0e3);
  padding: 20px;
  box-shadow: 
    8px 0 16px #d1d1d4,
    -4px 0 8px #ffffff;
  border: none;
}
.sidebar a, aside a {
  display: block;
  padding: 12px 16px;
  border-radius: 10px;
  color: #333;
  text-decoration: none;
  transition: all 0.2s ease;
  margin-bottom: 4px;
}
.sidebar a:hover, aside a:hover {
  background: #f0f0f3;
  box-shadow: 
    inset 3px 3px 6px #d1d1d4,
    inset -3px -3px 6px #ffffff;
}
`,

  sidebar_glassmorphism: `
/* Glassmorphism Sidebar */
.sidebar, aside, [data-component="sidebar"] {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 20px;
  border-right: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 4px 0 30px rgba(0, 0, 0, 0.05);
}
.sidebar a, aside a {
  display: block;
  padding: 12px 16px;
  border-radius: 10px;
  color: #1a1a2e;
  text-decoration: none;
  transition: all 0.2s ease;
  margin-bottom: 4px;
}
.sidebar a:hover, aside a:hover {
  background: rgba(255, 255, 255, 0.5);
}
`,

  // === TABLE COMPONENTS ===
  table_modern: `
/* Modern Tables */
table, .table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}
table th, .table th {
  background: #f9fafb;
  padding: 14px 16px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
}
table td, .table td {
  padding: 14px 16px;
  border-bottom: 1px solid #f3f4f6;
  color: #4b5563;
}
table tr:hover, .table tr:hover {
  background: #f9fafb;
}
`,

  table_glassmorphism: `
/* Glassmorphism Tables */
table, .table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
}
table th, .table th {
  background: rgba(255, 255, 255, 0.4);
  padding: 14px 16px;
  text-align: left;
  font-weight: 600;
  color: #1a1a2e;
}
table td, .table td {
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  color: #374151;
}
`,

  // === ALERT/BADGE COMPONENTS ===
  badge_modern: `
/* Modern Badges */
.badge, .tag, .chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 9999px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(99, 102, 241, 0.3);
}
`,

  alert_modern: `
/* Modern Alerts */
.alert, .notification, [role="alert"] {
  padding: 16px 20px;
  border-radius: 12px;
  border-left: 4px solid #6366f1;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
  color: #374151;
}
`,

  // === FOOTER COMPONENTS ===
  footer_modern: `
/* Modern Footer */
footer, .footer {
  background: #111827;
  color: #9ca3af;
  padding: 48px 24px;
}
footer a, .footer a {
  color: #d1d5db;
  text-decoration: none;
  transition: color 0.2s ease;
}
footer a:hover, .footer a:hover {
  color: #6366f1;
}
`,

  footer_glassmorphism: `
/* Glassmorphism Footer */
footer, .footer {
  background: rgba(17, 24, 39, 0.9);
  backdrop-filter: blur(20px);
  color: #9ca3af;
  padding: 48px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
`,

  // === HERO SECTION ===
  hero_modern: `
/* Modern Hero Section */
.hero, .hero-section, [data-component="hero"] {
  padding: 80px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
}
.hero h1, .hero-section h1 {
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 16px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.hero p, .hero-section p {
  font-size: 1.25rem;
  opacity: 0.9;
  max-width: 600px;
  margin: 0 auto;
}
`,

  hero_glassmorphism: `
/* Glassmorphism Hero */
.hero, .hero-section, [data-component="hero"] {
  padding: 80px 24px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.8) 0%, rgba(118, 75, 162, 0.8) 100%);
  backdrop-filter: blur(10px);
  color: white;
  text-align: center;
}
`,

  // === LOADING/SKELETON ===
  loading_modern: `
/* Modern Loading */
.loading, .spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.skeleton {
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
`,

  // === DARK MODE VARIANTS ===
  dark_mode_global: `
/* Dark Mode Override */
.dark, [data-theme="dark"] {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --border-color: #334155;
}
.dark body, [data-theme="dark"] body {
  background: var(--bg-primary);
  color: var(--text-primary);
}
.dark .card, [data-theme="dark"] .card {
  background: var(--bg-secondary);
  border-color: var(--border-color);
}
`,

  // === ANIMATION PRESETS ===
  animations_bounce: `
/* Bounce Animations */
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
.animate-bounce {
  animation: bounce 1s ease-in-out infinite;
}
button:hover, .btn:hover, .card:hover {
  animation: bounce 0.3s ease;
}
`,

  animations_fade: `
/* Fade Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}
.card, .modal, .alert {
  animation: fadeIn 0.3s ease-out;
}
`,

  animations_scale: `
/* Scale Animations */
@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.animate-scale-in {
  animation: scaleIn 0.2s ease-out;
}
button:active, .btn:active {
  transform: scale(0.98);
}
`,
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 GENERATE DESIGN CSS - Dynamically generate CSS for any selector
// ═══════════════════════════════════════════════════════════════════════════════
function generateDesignCSS(selector: string, designType: string, componentName: string): string {
  const styles: Record<string, Record<string, string>> = {
    neumorphism: {
      background: 'linear-gradient(145deg, #f0f0f3, #cacace)',
      borderRadius: '16px',
      padding: '16px',
      boxShadow: '8px 8px 16px #b8b8bb, -8px -8px 16px #ffffff',
      border: 'none',
      transition: 'all 0.3s ease',
    },
    glassmorphism: {
      background: 'rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderRadius: '16px',
      padding: '16px',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s ease',
    },
    modern: {
      background: 'white',
      borderRadius: '12px',
      padding: '16px',
      border: '2px solid #e5e7eb',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
      transition: 'all 0.2s ease',
    },
    dark: {
      background: '#1e293b',
      color: '#f1f5f9',
      borderRadius: '12px',
      padding: '16px',
      border: '1px solid #334155',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
      transition: 'all 0.2s ease',
    },
    gradient: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      borderRadius: '12px',
      padding: '16px',
      border: 'none',
      boxShadow: '0 4px 14px rgba(102, 126, 234, 0.4)',
      transition: 'all 0.3s ease',
    },
    minimal: {
      background: 'transparent',
      borderRadius: '8px',
      padding: '12px',
      border: '1px solid #e5e7eb',
      boxShadow: 'none',
      transition: 'all 0.15s ease',
    },
  };

  const style = styles[designType] || styles.modern;
  
  const cssProperties = Object.entries(style)
    .map(([prop, value]) => {
      // Convert camelCase to kebab-case
      const kebabProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `  ${kebabProp}: ${value};`;
    })
    .join('\n');

  return `
/* Auto-generated ${designType} design for ${componentName} */
${selector} {
${cssProperties}
}

${selector}:hover {
  transform: translateY(-2px);
  box-shadow: ${designType === 'neumorphism' 
    ? '6px 6px 12px #b8b8bb, -6px -6px 12px #ffffff' 
    : designType === 'glassmorphism'
    ? '0 12px 40px rgba(0, 0, 0, 0.15)'
    : '0 10px 25px -5px rgba(0, 0, 0, 0.1)'};
}
`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, params, sessionId } = body;

    if (!action) {
      return NextResponse.json({ 
        success: false, 
        error: 'Action is required' 
      }, { status: 400 });
    }

    const result: ActionResult = {
      success: false,
      action,
      details: '',
      timestamp: new Date().toISOString(),
    };

    console.log(`[AI Execute] 🚀 Executing action: ${action}`, params);

    switch (action) {
      // ═══════════════════════════════════════════════════════════════════════
      // 🎨 APPLY DESIGN - Actually apply design changes to ANY component
      // ═══════════════════════════════════════════════════════════════════════
      case 'apply_design': {
        const { component, designType, customCss, selector } = params || {};
        
        if (!component && !selector) {
          result.details = 'Component name or CSS selector required. Available components: ' + Object.keys(DESIGN_REGISTRY).slice(0, 15).join(', ') + ', ...';
          return NextResponse.json(result, { status: 400 });
        }

        // Find component in registry
        const componentInfo = component ? findComponent(component) : null;
        const targetComponent = componentInfo?.name || component || 'custom';
        
        // Get CSS from templates or custom
        let cssCode = customCss;
        if (!cssCode && designType) {
          // Try exact match first
          let templateKey = `${targetComponent}_${designType}`;
          cssCode = DESIGN_TEMPLATES[templateKey];
          
          // Try without underscore variations
          if (!cssCode) {
            templateKey = `${targetComponent.replace(/_/g, '')}_${designType}`;
            cssCode = DESIGN_TEMPLATES[templateKey];
          }
          
          // Try category-based template
          if (!cssCode && componentInfo) {
            templateKey = `${componentInfo.category}_${designType}`;
            cssCode = DESIGN_TEMPLATES[templateKey];
          }
        }

        // If still no CSS, generate based on selectors and design type
        if (!cssCode && componentInfo && designType) {
          const selectors = componentInfo.selectors.join(', ');
          cssCode = generateDesignCSS(selectors, designType, componentInfo.name);
        }

        // If custom selector provided, generate CSS for it
        if (!cssCode && selector && designType) {
          cssCode = generateDesignCSS(selector, designType, 'custom');
        }

        if (!cssCode) {
          // List available templates
          const availableTemplates = Object.keys(DESIGN_TEMPLATES).filter(k => 
            k.includes(targetComponent) || k.includes('modern') || k.includes('neumorphism')
          ).slice(0, 10);
          
          result.details = `No design template found for "${component}" with type "${designType}". Try: ${availableTemplates.join(', ')}. Or provide customCss.`;
          return NextResponse.json(result, { status: 400 });
        }

        // Store design in page_content table (using correct columns)
        const { error: insertError } = await supabaseAdmin
          .from('page_content')
          .upsert({
            page_key: `design_override_${targetComponent}`,
            title: `Design Override: ${targetComponent}`,
            content: cssCode,
            category: 'design',
            published: true,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'page_key',
          });

        if (insertError) {
          console.error('[AI Execute] Design save error:', insertError);
          result.details = `Failed to save design: ${insertError.message}`;
          return NextResponse.json(result, { status: 500 });
        }

        // Log the action
        await logAIAction(sessionId, 'apply_design', {
          component: targetComponent,
          designType,
          cssLength: cssCode.length,
          selectors: componentInfo?.selectors || [selector],
        });

        result.success = true;
        result.details = `✅ Design "${designType || 'custom'}" untuk komponen "${targetComponent}" berhasil diterapkan!\n\n` +
          `📝 CSS (${cssCode.length} karakter) disimpan ke database.\n` +
          `🔄 Refresh halaman untuk melihat perubahan.\n\n` +
          `Selectors yang ditarget: ${componentInfo?.selectors?.slice(0, 3).join(', ') || selector || 'custom'}`;
        result.data = { 
          cssApplied: true, 
          component: targetComponent, 
          designType,
          selectors: componentInfo?.selectors || [selector],
        };
        
        console.log(`[AI Execute] ✅ Design applied: ${targetComponent}`);
        break;
      }

      // ═══════════════════════════════════════════════════════════════════════
      // 📨 SEND NOTIFICATION - Send notification to user/admin
      // ═══════════════════════════════════════════════════════════════════════
      case 'send_notification': {
        const { targetSessionId, message, title, type } = params || {};
        
        if (!message) {
          result.details = 'Message is required';
          return NextResponse.json(result, { status: 400 });
        }

        // Store notification in database
        const { error: notifError } = await supabaseAdmin
          .from('admin_notifications')
          .insert({
            type: type || 'ai_notification',
            title: title || 'Notifikasi dari AI',
            message,
            target_role: 'all',
            session_id: targetSessionId || sessionId,
            is_read: false,
            created_at: new Date().toISOString(),
          });

        if (notifError) {
          console.error('[AI Execute] Notification error:', notifError);
          result.details = `Failed to send notification: ${notifError.message}`;
          return NextResponse.json(result, { status: 500 });
        }

        result.success = true;
        result.details = `Notifikasi berhasil dikirim: "${message.slice(0, 50)}..."`;
        
        console.log(`[AI Execute] ✅ Notification sent`);
        break;
      }

      // ═══════════════════════════════════════════════════════════════════════
      // 🔔 PROGRESS UPDATE - Send progress update to user
      // ═══════════════════════════════════════════════════════════════════════
      case 'progress_update': {
        const { progress, estimatedTime, status, taskId } = params || {};
        
        // Store progress in a dedicated table or page_content
        const progressData = {
          taskId: taskId || `task_${Date.now()}`,
          progress: progress || 0,
          status: status || 'in_progress',
          estimatedTime: estimatedTime || 'Unknown',
          updatedAt: new Date().toISOString(),
        };

        const { error: progressError } = await supabaseAdmin
          .from('page_content')
          .upsert({
            page_key: `ai_task_${sessionId || 'default'}`,
            title: `AI Task Progress`,
            content: JSON.stringify(progressData),
            category: 'ai_progress',
            published: false,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'page_key',
          });

        if (progressError) {
          result.details = `Failed to update progress: ${progressError.message}`;
          return NextResponse.json(result, { status: 500 });
        }

        result.success = true;
        result.details = `Progress updated: ${progress}% - ${status}`;
        result.data = progressData;
        
        console.log(`[AI Execute] ✅ Progress updated: ${progress}%`);
        break;
      }

      // ═══════════════════════════════════════════════════════════════════════
      // 📋 GET STATUS - Get current task status
      // ═══════════════════════════════════════════════════════════════════════
      case 'get_status': {
        const { taskSessionId } = params || {};
        
        const { data: statusData, error: statusError } = await supabaseAdmin
          .from('page_content')
          .select('content, updated_at')
          .eq('page_key', `ai_task_${taskSessionId || sessionId || 'default'}`)
          .single();

        if (statusError || !statusData) {
          result.details = 'No active task found';
          return NextResponse.json(result);
        }

        result.success = true;
        result.details = 'Task status retrieved';
        result.data = JSON.parse(statusData.content);
        break;
      }

      default:
        result.details = `Unknown action: ${action}. Available actions: apply_design, send_notification, progress_update, get_status`;
        return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[AI Execute] Error:', error);
    return NextResponse.json({
      success: false,
      action: 'unknown',
      details: `Error: ${error.message}`,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// Helper: Log AI action
async function logAIAction(sessionId: string | undefined, action: string, details: any) {
  try {
    await supabaseAdmin
      .from('page_content')
      .upsert({
        page_key: `ai_action_log_${Date.now()}`,
        title: `AI Action: ${action}`,
        content: JSON.stringify({
          sessionId,
          action,
          details,
          timestamp: new Date().toISOString(),
        }),
        category: 'ai_logs',
        published: false,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'page_key',
      });
  } catch (e) {
    console.error('[AI Execute] Failed to log action:', e);
  }
}

// GET - Get available actions and templates
export async function GET() {
  return NextResponse.json({
    availableActions: [
      {
        action: 'apply_design',
        description: 'Apply design changes to a component',
        params: {
          component: 'Component name (e.g., chat_input)',
          designType: 'Design template (neumorphism, glassmorphism, modern_minimal)',
          customCss: 'Optional custom CSS code',
        },
      },
      {
        action: 'send_notification',
        description: 'Send notification to user',
        params: {
          targetSessionId: 'Target session ID (optional)',
          message: 'Notification message',
          title: 'Notification title (optional)',
          type: 'Notification type (optional)',
        },
      },
      {
        action: 'progress_update',
        description: 'Update task progress',
        params: {
          progress: 'Progress percentage (0-100)',
          status: 'Status text',
          estimatedTime: 'Estimated completion time',
          taskId: 'Task ID (optional)',
        },
      },
      {
        action: 'get_status',
        description: 'Get current task status',
        params: {
          taskSessionId: 'Session ID to check (optional)',
        },
      },
    ],
    designTemplates: Object.keys(DESIGN_TEMPLATES),
  });
}
