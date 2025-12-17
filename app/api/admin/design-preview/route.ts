import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 DESIGN PREVIEW API - Super Admin Premium v5.0
// ═══════════════════════════════════════════════════════════════════════════════
// Generate design previews for realtime web redesign
// AI-powered design suggestions and CSS generation
// ═══════════════════════════════════════════════════════════════════════════════

// Supported components for redesign
const SUPPORTED_COMPONENTS = [
  'header', 'navbar', 'footer', 'sidebar',
  'hero', 'card', 'button', 'modal',
  'chat-widget', 'form', 'table', 'gallery',
  'homepage', 'dashboard', 'profile', 'sekbid'
];

// Design presets
const DESIGN_PRESETS = {
  modern: {
    borderRadius: '1rem',
    shadow: '0 10px 40px rgba(0,0,0,0.1)',
    gradient: 'from-indigo-500 via-purple-500 to-pink-500',
    font: 'font-sans',
  },
  minimalist: {
    borderRadius: '0.5rem',
    shadow: '0 2px 10px rgba(0,0,0,0.05)',
    gradient: 'from-slate-100 to-white',
    font: 'font-light',
  },
  glassmorphism: {
    borderRadius: '1.5rem',
    shadow: '0 8px 32px rgba(0,0,0,0.1)',
    gradient: 'bg-white/20 backdrop-blur-xl',
    font: 'font-medium',
  },
  neumorphism: {
    borderRadius: '1rem',
    shadow: '8px 8px 16px #d1d1d1, -8px -8px 16px #ffffff',
    gradient: 'bg-slate-100',
    font: 'font-normal',
  },
  brutalist: {
    borderRadius: '0',
    shadow: '4px 4px 0 #000',
    gradient: 'bg-yellow-400',
    font: 'font-bold',
  },
};

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { component, changes, preset } = body;

    if (!component) {
      return NextResponse.json({ 
        error: 'Component name required',
        supportedComponents: SUPPORTED_COMPONENTS 
      }, { status: 400 });
    }

    // Validate component
    const normalizedComponent = component.toLowerCase().trim();
    const isSupported = SUPPORTED_COMPONENTS.some(c => 
      normalizedComponent.includes(c)
    );

    // Parse design changes from natural language
    const parseDesignRequest = (text: string) => {
      const styles: Record<string, string> = {};
      
      // Color detection
      if (/biru|blue/i.test(text)) styles.primaryColor = '#3B82F6';
      if (/merah|red/i.test(text)) styles.primaryColor = '#EF4444';
      if (/hijau|green/i.test(text)) styles.primaryColor = '#10B981';
      if (/ungu|purple/i.test(text)) styles.primaryColor = '#8B5CF6';
      if (/pink/i.test(text)) styles.primaryColor = '#EC4899';
      if (/orange|oranye/i.test(text)) styles.primaryColor = '#F97316';
      if (/gelap|dark/i.test(text)) styles.theme = 'dark';
      if (/terang|light/i.test(text)) styles.theme = 'light';
      
      // Border radius
      if (/bulat|rounded|melengkung/i.test(text)) styles.borderRadius = '1rem';
      if (/kotak|square|tajam/i.test(text)) styles.borderRadius = '0';
      if (/pill|capsule/i.test(text)) styles.borderRadius = '9999px';
      
      // Shadow
      if (/shadow|bayangan|elevasi/i.test(text)) styles.shadow = '0 10px 40px rgba(0,0,0,0.15)';
      if (/flat|datar/i.test(text)) styles.shadow = 'none';
      
      // Size
      if (/besar|large|big/i.test(text)) styles.scale = '1.1';
      if (/kecil|small|compact/i.test(text)) styles.scale = '0.9';
      
      // Layout
      if (/center|tengah/i.test(text)) styles.align = 'center';
      if (/kiri|left/i.test(text)) styles.align = 'left';
      if (/kanan|right/i.test(text)) styles.align = 'right';
      
      // Spacing
      if (/rapat|compact|dense/i.test(text)) styles.padding = '0.5rem';
      if (/longgar|spacious|lega/i.test(text)) styles.padding = '2rem';
      
      // Typography
      if (/tebal|bold/i.test(text)) styles.fontWeight = 'bold';
      if (/tipis|thin/i.test(text)) styles.fontWeight = '300';
      
      // Animation
      if (/animasi|animate|efek/i.test(text)) styles.animation = 'true';
      
      return styles;
    };

    // Apply preset if specified
    let baseStyles = {};
    if (preset && DESIGN_PRESETS[preset as keyof typeof DESIGN_PRESETS]) {
      baseStyles = DESIGN_PRESETS[preset as keyof typeof DESIGN_PRESETS];
    }

    // Parse custom changes
    const customStyles = changes ? parseDesignRequest(changes) : {};
    
    // Merge styles
    const finalStyles = { ...baseStyles, ...customStyles };

    // Generate preview data
    const preview = {
      component: normalizedComponent,
      styles: finalStyles,
      preset: preset || 'custom',
      preview: generatePreviewCode(normalizedComponent, finalStyles),
      cssCode: generateCSSCode(normalizedComponent, finalStyles),
      approved: false,
      createdAt: new Date().toISOString(),
      supportedComponents: isSupported ? undefined : SUPPORTED_COMPONENTS,
    };

    return NextResponse.json({
      success: true,
      ...preview,
      message: `Design preview untuk "${component}" telah dibuat. Review dan apply jika sesuai.`,
    });

  } catch (error: any) {
    console.error('Design preview error:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}

// Generate preview HTML/React code
function generatePreviewCode(component: string, styles: Record<string, string>): string {
  const baseClasses = [
    styles.borderRadius ? `rounded-[${styles.borderRadius}]` : 'rounded-xl',
    styles.shadow !== 'none' ? 'shadow-lg' : '',
    styles.padding || 'p-4',
    styles.theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-800',
  ].filter(Boolean).join(' ');

  return `
<div className="${baseClasses}">
  {/* ${component} component preview */}
  <div className="space-y-4">
    <h3 className="font-semibold">Preview: ${component}</h3>
    <p className="text-sm opacity-70">Styles applied: ${JSON.stringify(styles)}</p>
  </div>
</div>`.trim();
}

// Generate CSS code
function generateCSSCode(component: string, styles: Record<string, string>): string {
  const cssRules = [];
  
  if (styles.primaryColor) {
    cssRules.push(`--primary-color: ${styles.primaryColor};`);
  }
  if (styles.borderRadius) {
    cssRules.push(`border-radius: ${styles.borderRadius};`);
  }
  if (styles.shadow && styles.shadow !== 'none') {
    cssRules.push(`box-shadow: ${styles.shadow};`);
  }
  if (styles.padding) {
    cssRules.push(`padding: ${styles.padding};`);
  }
  
  return `.${component}-component {\n  ${cssRules.join('\n  ')}\n}`;
}

// GET - Get available presets and components
export async function GET() {
  return NextResponse.json({
    success: true,
    presets: Object.keys(DESIGN_PRESETS),
    presetsDetail: DESIGN_PRESETS,
    supportedComponents: SUPPORTED_COMPONENTS,
    version: 'Premium v5.0',
  });
}
