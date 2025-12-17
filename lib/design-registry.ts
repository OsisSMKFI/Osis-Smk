/**
 * DESIGN REGISTRY - All components and their CSS selectors
 * This file defines what can be redesigned by AI
 * 
 * UPDATED: December 2025 - All selectors verified against actual website components
 */

export interface ComponentDesignInfo {
    name: string;
    displayName: string;
    description: string;
    selectors: string[];
    category: 'layout' | 'navigation' | 'form' | 'card' | 'button' | 'text' | 'media' | 'chat' | 'section' | 'other';
    defaultStyles?: string;
}

/**
 * Complete registry of all redesignable components
 * AI can target any of these for design changes
 * All selectors are verified to exist in the actual website
 */
export const DESIGN_REGISTRY: Record<string, ComponentDesignInfo> = {
    // === LAYOUT COMPONENTS ===
    hero: {
        name: 'hero',
        displayName: 'Hero Section',
        description: 'Hero/banner section at top of homepage with background image',
        selectors: ['[data-component="hero"]', '.hero-section', 'section.hero-section'],
        category: 'layout'
    },
    header: {
        name: 'header',
        displayName: 'Header',
        description: 'Main header area (navbar container)',
        selectors: ['[data-component="navbar"]', '.navbar-fixed', 'nav[role="navigation"]'],
        category: 'layout'
    },
    footer: {
        name: 'footer',
        displayName: 'Footer',
        description: 'Footer section at bottom of page',
        selectors: ['[data-component="footer"]', 'footer'],
        category: 'layout'
    },
    sidebar: {
        name: 'sidebar',
        displayName: 'Sidebar',
        description: 'Admin sidebar navigation',
        selectors: ['.sidebar', 'aside', '[data-component="sidebar"]', '.admin-sidebar'],
        category: 'layout'
    },
    main_content: {
        name: 'main_content',
        displayName: 'Main Content',
        description: 'Main content area of the page',
        selectors: ['main', '.main-content', '.page-content', '[data-component="main"]'],
        category: 'layout'
    },
    container: {
        name: 'container',
        displayName: 'Container',
        description: 'Page container/wrapper',
        selectors: ['.container', '.container-responsive', '.mx-auto.px-4', '.mx-auto.px-6'],
        category: 'layout'
    },

    // === NAVIGATION COMPONENTS ===
    navbar: {
        name: 'navbar',
        displayName: 'Navigation Bar',
        description: 'Floating navigation menu bar',
        selectors: ['[data-component="navbar"]', '.navbar-fixed', 'nav[role="navigation"]'],
        category: 'navigation'
    },
    nav_link: {
        name: 'nav_link',
        displayName: 'Navigation Links',
        description: 'Links in navigation',
        selectors: ['.nav-link', 'nav a', '.navbar-nav a', '[data-component="navbar"] a'],
        category: 'navigation'
    },
    navbar_brand: {
        name: 'navbar_brand',
        displayName: 'Navbar Brand/Logo',
        description: 'Logo and brand name in navbar',
        selectors: ['.navbar-brand', '[data-component="navbar"] a:first-child'],
        category: 'navigation'
    },
    breadcrumb: {
        name: 'breadcrumb',
        displayName: 'Breadcrumb',
        description: 'Breadcrumb navigation',
        selectors: ['.breadcrumb', '[data-component="breadcrumb"]', '.breadcrumbs'],
        category: 'navigation'
    },
    menu: {
        name: 'menu',
        displayName: 'Menu',
        description: 'Dropdown or side menu',
        selectors: ['.menu', '.dropdown-menu', '[data-component="menu"]'],
        category: 'navigation'
    },

    // === SECTION COMPONENTS (Homepage) ===
    vision_card: {
        name: 'vision_card',
        displayName: 'Vision Card',
        description: 'Vision statement card on homepage',
        selectors: ['[data-component="vision-card"]', '#vision .card-gradient'],
        category: 'section'
    },
    mission_card: {
        name: 'mission_card',
        displayName: 'Mission Card',
        description: 'Mission/goals cards on homepage',
        selectors: ['[data-component="mission-card"]', '.card-gradient'],
        category: 'section'
    },
    goals_section: {
        name: 'goals_section',
        displayName: 'Goals Section',
        description: 'Goals/mission section on homepage',
        selectors: ['#mission section', '[data-component="goals"]'],
        category: 'section'
    },
    latest_posts: {
        name: 'latest_posts',
        displayName: 'Latest Posts Section',
        description: 'Latest posts/articles section',
        selectors: ['[data-component="latest-posts"]', '#latest-posts'],
        category: 'section'
    },
    announcements: {
        name: 'announcements',
        displayName: 'Announcements Section',
        description: 'Announcements widget on homepage',
        selectors: ['[data-component="announcements"]'],
        category: 'section'
    },
    polls: {
        name: 'polls',
        displayName: 'Polls Section',
        description: 'Polls widget on homepage',
        selectors: ['[data-component="polls"]'],
        category: 'section'
    },

    // === CARD COMPONENTS ===
    card: {
        name: 'card',
        displayName: 'Card',
        description: 'General content card components',
        selectors: ['.card-gradient', '.card-modern', '[data-component*="card"]'],
        category: 'card'
    },
    post_card: {
        name: 'post_card',
        displayName: 'Post Card',
        description: 'Blog post/article cards',
        selectors: ['[data-component="post-card"]'],
        category: 'card'
    },
    card_header: {
        name: 'card_header',
        displayName: 'Card Header',
        description: 'Header section of cards',
        selectors: ['.card-header', '.card h3', '.card-title'],
        category: 'card'
    },
    card_body: {
        name: 'card_body',
        displayName: 'Card Body',
        description: 'Body/content section of cards',
        selectors: ['.card-body', '.card-content', '.p-6', '.p-8'],
        category: 'card'
    },

    // === BUTTON COMPONENTS ===
    button: {
        name: 'button',
        displayName: 'Button',
        description: 'All buttons',
        selectors: ['button', '.btn', '.btn-primary', '[data-component="button"]', 'input[type="submit"]'],
        category: 'button'
    },
    button_primary: {
        name: 'button_primary',
        displayName: 'Primary Button',
        description: 'Primary action buttons (gradient gold/amber)',
        selectors: ['.btn-primary', '.bg-gradient-to-r.from-amber-500', '.from-yellow-500.to-amber-500'],
        category: 'button'
    },
    button_secondary: {
        name: 'button_secondary',
        displayName: 'Secondary Button',
        description: 'Secondary action buttons',
        selectors: ['.btn-secondary', '.bg-gray-100', '.bg-white.border'],
        category: 'button'
    },
    icon_button: {
        name: 'icon_button',
        displayName: 'Icon Button',
        description: 'Buttons with icons (social media, toggles)',
        selectors: ['.icon-btn', '.btn-icon', '[data-component="icon-button"]', '.w-10.h-10.rounded-full'],
        category: 'button'
    },

    // === FORM COMPONENTS ===
    form: {
        name: 'form',
        displayName: 'Form',
        description: 'Form containers',
        selectors: ['form', '.form', '[data-component="form"]'],
        category: 'form'
    },
    input: {
        name: 'input',
        displayName: 'Input Field',
        description: 'Text input fields',
        selectors: ['input[type="text"]', 'input[type="email"]', 'input[type="password"]', '.input', '[data-component="input"]', 'input.rounded-lg', 'input.rounded-xl'],
        category: 'form'
    },
    textarea: {
        name: 'textarea',
        displayName: 'Textarea',
        description: 'Multi-line text areas',
        selectors: ['textarea', '.textarea', '[data-component="textarea"]'],
        category: 'form'
    },
    select: {
        name: 'select',
        displayName: 'Select/Dropdown',
        description: 'Select dropdown fields',
        selectors: ['select', '.select', '[data-component="select"]'],
        category: 'form'
    },
    checkbox: {
        name: 'checkbox',
        displayName: 'Checkbox',
        description: 'Checkbox inputs',
        selectors: ['input[type="checkbox"]', '.checkbox', '[data-component="checkbox"]'],
        category: 'form'
    },
    label: {
        name: 'label',
        displayName: 'Form Label',
        description: 'Labels for form fields',
        selectors: ['label', '.label', '.form-label', '[data-component="label"]'],
        category: 'form'
    },

    // === TEXT COMPONENTS ===
    heading: {
        name: 'heading',
        displayName: 'Headings',
        description: 'All heading elements',
        selectors: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', '.heading', '[data-component="heading"]'],
        category: 'text'
    },
    h1: {
        name: 'h1',
        displayName: 'Heading 1',
        description: 'Main page headings',
        selectors: ['h1', '.h1'],
        category: 'text'
    },
    h2: {
        name: 'h2',
        displayName: 'Heading 2',
        description: 'Section headings',
        selectors: ['h2', '.h2'],
        category: 'text'
    },
    paragraph: {
        name: 'paragraph',
        displayName: 'Paragraph',
        description: 'Paragraph text',
        selectors: ['p', '.paragraph', '.text-body'],
        category: 'text'
    },
    link: {
        name: 'link',
        displayName: 'Link',
        description: 'Hyperlinks',
        selectors: ['a', '.link', '[data-component="link"]'],
        category: 'text'
    },
    list: {
        name: 'list',
        displayName: 'List',
        description: 'Ordered and unordered lists',
        selectors: ['ul', 'ol', '.list', '[data-component="list"]'],
        category: 'text'
    },

    // === MEDIA COMPONENTS ===
    image: {
        name: 'image',
        displayName: 'Image',
        description: 'Images and figures',
        selectors: ['img', '.image', 'figure', '[data-component="image"]'],
        category: 'media'
    },
    avatar: {
        name: 'avatar',
        displayName: 'Avatar',
        description: 'User avatars/profile pictures',
        selectors: ['.avatar', '.profile-pic', '[data-component="avatar"]'],
        category: 'media'
    },
    icon: {
        name: 'icon',
        displayName: 'Icon',
        description: 'Icons',
        selectors: ['.icon', 'svg', 'i.fa', 'i.fas', 'i.fab', '[data-component="icon"]'],
        category: 'media'
    },
    video: {
        name: 'video',
        displayName: 'Video',
        description: 'Video elements',
        selectors: ['video', '.video', 'iframe[src*="youtube"]', '[data-component="video"]'],
        category: 'media'
    },

    // === CHAT COMPONENTS ===
    chat_widget: {
        name: 'chat_widget',
        displayName: 'Chat Widget',
        description: 'The floating chat widget',
        selectors: ['.live-chat-widget', '[data-component="chat-widget"]', '.chat-container'],
        category: 'chat'
    },
    chat_input: {
        name: 'chat_input',
        displayName: 'Chat Input',
        description: 'Chat message input field',
        selectors: ['.chat-input', '.message-input', '[data-component="chat-input"]', '.live-chat-widget input'],
        category: 'chat'
    },
    chat_message: {
        name: 'chat_message',
        displayName: 'Chat Message',
        description: 'Individual chat messages',
        selectors: ['.chat-message', '.message-bubble', '[data-component="chat-message"]'],
        category: 'chat'
    },
    chat_button: {
        name: 'chat_button',
        displayName: 'Chat Button',
        description: 'Chat send button and toggle',
        selectors: ['.chat-button', '.send-button', '[data-component="chat-button"]', '.chat-toggle'],
        category: 'chat'
    },

    // === OTHER COMPONENTS ===
    modal: {
        name: 'modal',
        displayName: 'Modal',
        description: 'Modal/dialog boxes',
        selectors: ['.modal', '.dialog', '[data-component="modal"]', '[role="dialog"]'],
        category: 'other'
    },
    table: {
        name: 'table',
        displayName: 'Table',
        description: 'Data tables',
        selectors: ['table', '.table', '[data-component="table"]'],
        category: 'other'
    },
    badge: {
        name: 'badge',
        displayName: 'Badge',
        description: 'Status badges and tags',
        selectors: ['.badge', '.tag', '.chip', '[data-component="badge"]'],
        category: 'other'
    },
    alert: {
        name: 'alert',
        displayName: 'Alert',
        description: 'Alert/notification boxes',
        selectors: ['.alert', '.notification', '[data-component="alert"]', '[role="alert"]'],
        category: 'other'
    },
    tooltip: {
        name: 'tooltip',
        displayName: 'Tooltip',
        description: 'Tooltips and popovers',
        selectors: ['.tooltip', '[data-component="tooltip"]', '[role="tooltip"]'],
        category: 'other'
    },
    loading: {
        name: 'loading',
        displayName: 'Loading',
        description: 'Loading spinners and skeletons',
        selectors: ['.loading', '.spinner', '.skeleton', '[data-component="loading"]'],
        category: 'other'
    },
    divider: {
        name: 'divider',
        displayName: 'Divider',
        description: 'Horizontal/vertical dividers',
        selectors: ['hr', '.divider', '[data-component="divider"]'],
        category: 'other'
    },
    section: {
        name: 'section',
        displayName: 'Section',
        description: 'Page sections',
        selectors: ['section', '.section', '[data-component="section"]'],
        category: 'other'
    }
};

/**
 * Get component info by name (case-insensitive, handles variations)
 */
export function findComponent(query: string): ComponentDesignInfo | null {
    const normalized = query.toLowerCase().replace(/[\s-_]/g, '');
    
    // Direct match
    if (DESIGN_REGISTRY[query]) {
        return DESIGN_REGISTRY[query];
    }
    
    // Normalized match
    for (const [key, info] of Object.entries(DESIGN_REGISTRY)) {
        const normalizedKey = key.replace(/[\s-_]/g, '');
        if (normalizedKey === normalized || info.displayName.toLowerCase().replace(/[\s-_]/g, '') === normalized) {
            return info;
        }
    }
    
    // Partial match
    for (const [key, info] of Object.entries(DESIGN_REGISTRY)) {
        if (key.includes(normalized) || info.displayName.toLowerCase().includes(query.toLowerCase())) {
            return info;
        }
    }
    
    return null;
}

/**
 * Get all components in a category
 */
export function getComponentsByCategory(category: ComponentDesignInfo['category']): ComponentDesignInfo[] {
    return Object.values(DESIGN_REGISTRY).filter(c => c.category === category);
}

/**
 * Get all component names (for AI reference)
 */
export function getAllComponentNames(): string[] {
    return Object.keys(DESIGN_REGISTRY);
}
