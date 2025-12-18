import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🖼️ DYNAMIC OG IMAGE GENERATOR v1.0
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Generates unique Open Graph thumbnails for each page/post.
 * Features:
 * - Dynamic title rendering
 * - Category-based styling
 * - Gradient backgrounds
 * - Logo integration
 * 
 * @endpoint GET /api/og
 * @params title, description, type, image
 */

export const runtime = 'edge';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        
        // Get parameters
        const title = searchParams.get('title') || 'Webosis';
        const description = searchParams.get('description') || '';
        const type = searchParams.get('type') || 'default'; // post, page, sekbid, event, member
        const imageUrl = searchParams.get('image') || '';
        const category = searchParams.get('category') || '';
        
        // Type-based styling
        const typeStyles: Record<string, { gradient: string; accent: string; icon: string }> = {
            default: { 
                gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                accent: '#667eea',
                icon: '🌐'
            },
            post: { 
                gradient: 'linear-gradient(135deg, #0f0f1a 0%, #1a0a2e 100%)',
                accent: '#f093fb',
                icon: '📰'
            },
            sekbid: { 
                gradient: 'linear-gradient(135deg, #0a192f 0%, #112240 100%)',
                accent: '#64ffda',
                icon: '👥'
            },
            event: { 
                gradient: 'linear-gradient(135deg, #1a0a20 0%, #2d1f3d 100%)',
                accent: '#ff6b6b',
                icon: '📅'
            },
            member: { 
                gradient: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
                accent: '#58a6ff',
                icon: '👤'
            },
            gallery: { 
                gradient: 'linear-gradient(135deg, #1e1e2e 0%, #2e2e4e 100%)',
                accent: '#f9c74f',
                icon: '🖼️'
            }
        };
        
        const style = typeStyles[type] || typeStyles.default;
        
        // Truncate long text
        const displayTitle = title.length > 60 ? title.slice(0, 57) + '...' : title;
        const displayDesc = description.length > 120 ? description.slice(0, 117) + '...' : description;
        
        return new ImageResponse(
            (
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        background: style.gradient,
                        padding: '60px',
                        fontFamily: 'system-ui, -apple-system, sans-serif'
                    }}
                >
                    {/* Header with logo and category */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%'
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px'
                            }}
                        >
                            <div
                                style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    background: `linear-gradient(135deg, ${style.accent}, #667eea)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '24px'
                                }}
                            >
                                {style.icon}
                            </div>
                            <span
                                style={{
                                    fontSize: '24px',
                                    fontWeight: 'bold',
                                    color: 'white'
                                }}
                            >
                                WEBOSIS
                            </span>
                        </div>
                        
                        {category && (
                            <div
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '999px',
                                    background: `${style.accent}20`,
                                    border: `1px solid ${style.accent}40`,
                                    color: style.accent,
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}
                            >
                                {category}
                            </div>
                        )}
                    </div>
                    
                    {/* Main content */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px',
                            maxWidth: imageUrl ? '60%' : '100%'
                        }}
                    >
                        <h1
                            style={{
                                fontSize: displayTitle.length > 40 ? '48px' : '56px',
                                fontWeight: 'bold',
                                color: 'white',
                                lineHeight: 1.2,
                                margin: 0,
                                textShadow: '0 4px 12px rgba(0,0,0,0.3)'
                            }}
                        >
                            {displayTitle}
                        </h1>
                        
                        {displayDesc && (
                            <p
                                style={{
                                    fontSize: '22px',
                                    color: 'rgba(255,255,255,0.7)',
                                    lineHeight: 1.5,
                                    margin: 0
                                }}
                            >
                                {displayDesc}
                            </p>
                        )}
                    </div>
                    
                    {/* Footer with branding */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%'
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}
                        >
                            <div
                                style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: '#22c55e'
                                }}
                            />
                            <span
                                style={{
                                    fontSize: '16px',
                                    color: 'rgba(255,255,255,0.5)'
                                }}
                            >
                                webosis.id
                            </span>
                        </div>
                        
                        {/* Accent line */}
                        <div
                            style={{
                                width: '120px',
                                height: '4px',
                                borderRadius: '2px',
                                background: `linear-gradient(90deg, ${style.accent}, transparent)`
                            }}
                        />
                    </div>
                    
                    {/* Optional image overlay */}
                    {imageUrl && (
                        <div
                            style={{
                                position: 'absolute',
                                right: '60px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '300px',
                                height: '300px',
                                borderRadius: '20px',
                                overflow: 'hidden',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                                border: `2px solid ${style.accent}30`
                            }}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={imageUrl}
                                alt=""
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                            />
                        </div>
                    )}
                    
                    {/* Decorative elements */}
                    <div
                        style={{
                            position: 'absolute',
                            top: '50%',
                            right: '10%',
                            width: '400px',
                            height: '400px',
                            borderRadius: '50%',
                            background: `radial-gradient(circle, ${style.accent}10 0%, transparent 70%)`,
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none'
                        }}
                    />
                </div>
            ),
            {
                width: 1200,
                height: 630
            }
        );
    } catch (error) {
        console.error('OG Image generation error:', error);
        
        // Fallback simple image
        return new ImageResponse(
            (
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                        fontSize: '48px',
                        fontWeight: 'bold',
                        color: 'white'
                    }}
                >
                    WEBOSIS
                </div>
            ),
            { width: 1200, height: 630 }
        );
    }
}
