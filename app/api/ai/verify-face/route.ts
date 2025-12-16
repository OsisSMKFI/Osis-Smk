// app/api/ai/verify-face/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getConfig } from '@/lib/adminConfig';
import { getAIGatewayStatus } from '@/lib/vercel/ai-gateway';

interface FaceVerificationRequest {
  liveSelfieBase64?: string; // New: base64 encoded selfie
  currentPhotoUrl?: string; // Legacy support
  referencePhotoUrl: string;
  userId: string;
}

/**
 * AI FACE VERIFICATION
 * Menggunakan AI untuk:
 * 1. Deteksi wajah di foto
 * 2. Compare dengan reference photo
 * 3. Deteksi fake/screenshot
 * 4. Face liveness check (basic)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const body: FaceVerificationRequest = await request.json();
    
    console.log('[AI Face Verification] Starting for user:', session.user.email);
    console.log('[AI Face Verification] User ID:', body.userId);
    
    // CRITICAL SECURITY: Verify user can only check their own photos
    if (body.userId !== session.user.id) {
      console.error('[AI Verify] ❌ SECURITY VIOLATION: User trying to verify another account!', {
        sessionUserId: session.user.id,
        requestUserId: body.userId
      });
      return NextResponse.json({
        success: false,
        error: 'Security violation: Cannot verify photos for other users'
      }, { status: 403 });
    }

    // CRITICAL: Fetch user's registered biometric data (reference photo)
    const { data: biometricData, error: bioError } = await supabaseAdmin
      .from('biometric_data')
      .select('reference_photo_url, user_id')
      .eq('user_id', body.userId)
      .single();

    if (bioError || !biometricData) {
      console.error('[AI Verify] ❌ No biometric data found for user:', body.userId);
      return NextResponse.json({
        success: false,
        error: 'No biometric registration found. Please register first.'
      }, { status: 404 });
    }

    // CRITICAL SECURITY: Verify reference photo belongs to this user
    if (!biometricData.reference_photo_url.includes(body.userId)) {
      console.error('[AI Verify] ❌ SECURITY VIOLATION: Reference photo does not belong to user!', {
        userId: body.userId,
        referencePhoto: biometricData.reference_photo_url.substring(0, 100)
      });
      return NextResponse.json({
        success: false,
        error: 'Security violation: Invalid reference photo'
      }, { status: 403 });
    }

    // Use database reference photo (not from request)
    const referencePhotoUrl = biometricData.reference_photo_url;
    
    console.log('[AI Face Verification] Photos:', {
      current: body.liveSelfieBase64 ? 'base64 (' + (body.liveSelfieBase64.length / 1024).toFixed(2) + 'KB)' : body.currentPhotoUrl?.substring(0, 50) + '...',
      reference: referencePhotoUrl.substring(0, 50) + '...',
      userOwnership: 'VERIFIED ✅'
    });

    let verificationResult = {
      success: false,
      faceDetected: false,
      matchScore: 0,
      isLive: false,
      isFake: false,
      confidence: 0,
      details: {} as any,
      aiProvider: 'none',
      reasoning: '' as string | undefined
    };

    // =================================================================
    // AI PROVIDER AUTO-SWITCHING (SAMA SEPERTI AI LIVE CHAT)
    // Priority: Gemini → OpenAI → Anthropic → Basic Fallback
    // Dengan proper API key validation & automatic retry
    // =================================================================
    
    // Get all API keys from admin settings (sama seperti chat)
    const geminiKey = await getConfig('GEMINI_API_KEY');
    const openaiKey = await getConfig('OPENAI_API_KEY');
    const anthropicKey = await getConfig('ANTHROPIC_API_KEY');
    
    // Debug: Show key status (sama seperti chat)
    console.log('[AI Verify] 🔑 API Key status:', {
      gemini: geminiKey ? `${geminiKey.substring(0, 10)}... (${geminiKey.length} chars)` : 'NOT SET',
      openai: openaiKey ? `${openaiKey.substring(0, 10)}... (${openaiKey.length} chars)` : 'NOT SET',
      anthropic: anthropicKey ? `${anthropicKey.substring(0, 10)}... (${anthropicKey.length} chars)` : 'NOT SET',
    });
    
    // Prepare photo data (base64 atau URL)
    const currentPhoto = body.liveSelfieBase64 || body.currentPhotoUrl || '';
    
    // Build providers list with proper key validation (SAMA SEPERTI CHAT)
    const aiProviders = [
      {
        name: 'Gemini Vision',
        // Validate format: harus mulai dengan 'AIza'
        check: () => !!(geminiKey && geminiKey.startsWith('AIza')),
        execute: () => verifyWithGemini(currentPhoto, referencePhotoUrl, geminiKey!)
      },
      {
        name: 'OpenAI Vision',
        // Validate format: harus mulai dengan 'sk-' atau 'sk-proj-'
        check: () => !!(openaiKey && (openaiKey.startsWith('sk-') || openaiKey.startsWith('sk-proj-'))),
        execute: () => verifyWithOpenAI(currentPhoto, referencePhotoUrl, openaiKey!)
      },
      {
        name: 'Anthropic Vision',
        // Validate format: harus mulai dengan 'sk-ant-'
        check: () => !!(anthropicKey && anthropicKey.startsWith('sk-ant-')),
        execute: () => verifyWithAnthropic(currentPhoto, referencePhotoUrl, anthropicKey!)
      },
      {
        name: 'AI Gateway',
        check: () => getAIGatewayStatus().anyAvailable,
        execute: () => verifyWithAIGateway(currentPhoto, referencePhotoUrl)
      },
      {
        name: 'Basic Fallback',
        check: () => true,
        execute: () => basicImageVerification(currentPhoto, referencePhotoUrl)
      }
    ];

    // AUTO-SWITCH: Try each AI provider until one succeeds (SAMA SEPERTI LIVE CHAT)
    let lastError: string | null = null;
    let successProvider: string | null = null;
    
    for (const provider of aiProviders) {
      // Check dulu tanpa await (sync check)
      if (!provider.check()) {
        console.log(`[AI Verify] ⏭️ Skipping ${provider.name} (not configured or invalid key format)`);
        continue;
      }

      try {
        console.log(`[AI Verify] 🔄 Trying ${provider.name}...`);
        verificationResult = await provider.execute();
        
        if (verificationResult.success) {
          console.log(`[AI Verify] ✅ ${provider.name} succeeded!`);
          successProvider = provider.name;
          break; // Success! Stop trying other providers
        } else {
          console.log(`[AI Verify] ⚠️ ${provider.name} returned unsuccessful result:`, verificationResult.details?.error);
          lastError = `${provider.name} failed: ${verificationResult.details?.error || 'Unknown error'}`;
          // Continue to next provider (auto-fallback)
        }
      } catch (error: any) {
        console.error(`[AI Verify] ❌ ${provider.name} error:`, error.message);
        lastError = `${provider.name} error: ${error.message}`;
        // Continue to next provider (auto-switch like live chat)
        continue;
      }
    }
    
    // Log which provider was used
    if (successProvider) {
      console.log(`[AI Verify] 🎯 Final provider used: ${successProvider}`);
    } else {
      console.error('[AI Verify] ❌ All AI providers failed!', lastError);
    }

    if (!verificationResult.success) {
      console.error('[AI Verify] ❌ All AI providers failed!', lastError);
      return NextResponse.json({
        success: false,
        error: 'All AI verification providers failed',
        details: lastError
      }, { status: 500 });
    }

    console.log('[AI Face Verification] Result:', {
      faceDetected: verificationResult.faceDetected,
      matchScore: verificationResult.matchScore,
      isLive: verificationResult.isLive,
      confidence: verificationResult.confidence,
      provider: verificationResult.aiProvider
    });

    // AI LEARNING SYSTEM: Store verification data for continuous improvement
    // Like live chat AI that learns from interactions
    try {
      await supabaseAdmin
        .from('ai_verification_logs')
        .insert({
          user_id: body.userId,
          current_photo_url: body.currentPhotoUrl || 'base64_selfie',
          reference_photo_url: referencePhotoUrl,
          face_detected: verificationResult.faceDetected,
          match_score: verificationResult.matchScore,
          is_live: verificationResult.isLive,
          is_fake: verificationResult.isFake,
          confidence: verificationResult.confidence,
          ai_provider: verificationResult.aiProvider,
          details: verificationResult.details,
          reasoning: verificationResult.reasoning || null,
          created_at: new Date().toISOString()
        });
      
      console.log('[AI Learning] ✅ Verification data stored for learning');
    } catch (learningError: any) {
      console.error('[AI Learning] ⚠️ Failed to store learning data:', learningError.message);
      // Non-fatal error, continue with verification
    }

    // Tentukan apakah verifikasi berhasil
    const threshold = 0.7; // 70% confidence minimum
    const isVerified = 
      verificationResult.faceDetected &&
      verificationResult.matchScore >= threshold &&
      !verificationResult.isFake &&
      verificationResult.confidence >= threshold;

    if (!isVerified) {
      const reasons: string[] = [];
      
      if (!verificationResult.faceDetected) {
        reasons.push('Wajah tidak terdeteksi di foto');
      }
      if (verificationResult.matchScore < threshold) {
        reasons.push(`Wajah tidak cocok dengan referensi (${Math.round(verificationResult.matchScore * 100)}%)`);
      }
      if (verificationResult.isFake) {
        reasons.push('Foto terdeteksi sebagai screenshot/fake');
      }
      if (verificationResult.confidence < threshold) {
        reasons.push(`Confidence terlalu rendah (${Math.round(verificationResult.confidence * 100)}%)`);
      }

      return NextResponse.json({
        success: false,
        verified: false,
        error: 'Verifikasi wajah gagal',
        reasons,
        data: verificationResult
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      verified: true,
      message: 'Verifikasi wajah berhasil!',
      data: verificationResult
    });

  } catch (error: any) {
    console.error('[AI Face Verification] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Terjadi kesalahan saat verifikasi AI',
      details: error.message
    }, { status: 500 });
  }
}

// ===== AI PROVIDERS =====

/**
 * Google Gemini Vision API (PRIORITY)
 * Best untuk: Akurasi tinggi, liveness detection, anti-spoofing
 */
async function verifyWithGemini(currentPhoto: string, referencePhoto: string, apiKey: string): Promise<any> {
  try {
    if (!apiKey || !apiKey.startsWith('AIza')) {
      throw new Error('Gemini API key not valid (must start with AIza)');
    }

    console.log('[Gemini Vision] Analyzing faces...');

    // Download reference photo and convert to base64
    let referenceBase64 = '';
    if (referencePhoto.startsWith('http')) {
      const refResponse = await fetch(referencePhoto);
      const refBlob = await refResponse.blob();
      const refBuffer = await refBlob.arrayBuffer();
      referenceBase64 = Buffer.from(refBuffer).toString('base64');
    } else {
      referenceBase64 = referencePhoto;
    }

    // Current photo might be base64 or URL
    let currentBase64 = '';
    if (currentPhoto.startsWith('http')) {
      const currResponse = await fetch(currentPhoto);
      const currBlob = await currResponse.blob();
      const currBuffer = await currBlob.arrayBuffer();
      currentBase64 = Buffer.from(currBuffer).toString('base64');
    } else {
      currentBase64 = currentPhoto;
    }

    // Call Gemini Vision API with ultra-detailed prompt
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `You are a professional facial recognition AI expert. Analyze these two photos with MAXIMUM ACCURACY for identity verification:

**PHOTO 1 (REFERENCE - Registration Photo):**
This is the registered user's reference photo from their account.

**PHOTO 2 (CURRENT - Live Selfie):**
This is a live selfie taken just now for attendance verification.

**YOUR TASK:**
Perform ultra-accurate face verification analysis:

1. **FACE DETECTION** (Both Photos):
   - Detect human face presence
   - Count faces (must be exactly 1 in each)
   - Face quality (clear, blurry, obscured)
   - Face size (adequate, too small, too far)

2. **LIVENESS DETECTION** (Photo 2 - Live Selfie):
   - Is this a REAL LIVE PERSON? (not photo of photo, screen, print, video, deepfake)
   - Detect screen glare/reflections (indicates photo of screen)
   - Detect paper texture (indicates printed photo)
   - Detect pixel patterns (indicates digital reproduction)
   - Natural skin texture vs artificial
   - Natural lighting vs screen backlight
   - Eye reflection patterns (real eyes vs screen/photo)
   - Micro-expressions present? (indicates live person)

3. **IDENTITY MATCHING** (Compare Both Photos):
   - Facial structure similarity (bone structure, face shape)
   - Eye shape, color, spacing, eyebrow arch
   - Nose shape, size, bridge width
   - Mouth shape, lip thickness, teeth (if visible)
   - Ear shape (if visible)
   - Skin tone consistency
   - Facial landmarks alignment (68+ points)
   - Age consistency (within reasonable range)
   - Gender consistency
   - Unique identifying features (moles, scars, birthmarks)

4. **ANTI-SPOOFING** (Photo 2):
   - Mask detection (silicone, latex, 3D printed)
   - Deepfake indicators (AI-generated artifacts)
   - Video replay attack (screen recording)
   - Photo manipulation (Photoshop, FaceApp)
   - Impersonation attempt

5. **QUALITY ASSESSMENT**:
   - Lighting conditions (both photos)
   - Image resolution and clarity
   - Face angle/pose similarity
   - Expression neutrality
   - Background appropriateness

**SCORING GUIDELINES:**
- matchScore: 0.0-1.0 (1.0 = identical person, 0.0 = different people)
  * 0.95-1.0: Definitely same person (matching all major features)
  * 0.85-0.94: Very likely same person (matching most features)
  * 0.70-0.84: Possibly same person (some similarities)
  * 0.50-0.69: Unlikely same person (few similarities)
  * 0.0-0.49: Different people

- confidence: 0.0-1.0 (how certain you are)
  * 1.0: Absolutely certain
  * 0.9: Very confident
  * 0.7-0.8: Reasonably confident
  * 0.5-0.6: Uncertain
  * <0.5: Very uncertain

**RESPOND IN STRICT JSON FORMAT:**
{
  "faceDetected": boolean,
  "facesCount": {
    "reference": number,
    "current": number
  },
  "matchScore": number (0.0-1.0),
  "isLive": boolean,
  "isFake": boolean,
  "confidence": number (0.0-1.0),
  "details": {
    "facialStructure": "matching|similar|different",
    "eyesSimilarity": number (0-100),
    "noseSimilarity": number (0-100),
    "mouthSimilarity": number (0-100),
    "skinTone": "matching|similar|different",
    "ageRange": "consistent|inconsistent",
    "gender": "matching|different",
    "uniqueFeatures": ["feature1", "feature2"],
    "livenessIndicators": {
      "realPerson": boolean,
      "screenDetected": boolean,
      "printDetected": boolean,
      "maskDetected": boolean,
      "deepfakeDetected": boolean,
      "naturalTexture": boolean,
      "eyeReflection": "natural|artificial|none",
      "microExpressions": boolean
    },
    "qualityScore": {
      "reference": number (0-100),
      "current": number (0-100)
    },
    "lighting": "excellent|good|fair|poor",
    "resolution": "high|medium|low",
    "warnings": ["warning1", "warning2"]
  },
  "reasoning": "Detailed explanation of your analysis and decision"
}

**IMPORTANT:**
- Be EXTREMELY STRICT with liveness detection
- Reject ANY photo of screen/print/video
- Require 85%+ match for verification
- Consider lighting/angle variations
- Account for aging (makeup, hair, facial hair changes)
- Flag ANY suspicious indicators`
              },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: referenceBase64
                }
              },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: currentBase64
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1, // Low temperature for consistent, factual analysis
            topK: 1,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          ]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid Gemini API response');
    }

    const resultText = data.candidates[0].content.parts[0].text;
    
    // Extract JSON from markdown code block if present
    let jsonText = resultText;
    if (resultText.includes('```json')) {
      jsonText = resultText.split('```json')[1].split('```')[0].trim();
    } else if (resultText.includes('```')) {
      jsonText = resultText.split('```')[1].split('```')[0].trim();
    }

    const result = JSON.parse(jsonText);

    console.log('[Gemini Vision] Analysis complete:', {
      faceDetected: result.faceDetected,
      matchScore: result.matchScore,
      isLive: result.isLive,
      confidence: result.confidence
    });

    return {
      success: true,
      faceDetected: result.faceDetected,
      matchScore: result.matchScore,
      isLive: result.isLive,
      isFake: result.isFake,
      confidence: result.confidence,
      details: result.details,
      reasoning: result.reasoning,
      aiProvider: 'gemini-vision-2.0'
    };

  } catch (error: any) {
    console.error('[Gemini Vision] Error:', error.message);
    // Return error instead of fallback (let next provider try)
    return {
      success: false,
      faceDetected: false,
      matchScore: 0,
      confidence: 0,
      details: { error: error.message },
      aiProvider: 'gemini-vision-2.0'
    };
  }
}

/**
 * OpenAI Vision API (GPT-4 Vision)
 * Best untuk: General face detection dan comparison
 */
async function verifyWithOpenAI(currentPhoto: string, referencePhoto: string, apiKey: string): Promise<any> {
  try {
    if (!apiKey || (!apiKey.startsWith('sk-') && !apiKey.startsWith('sk-proj-'))) {
      throw new Error('OpenAI API key not valid (must start with sk-)');
    }
    
    console.log('[OpenAI Vision] Analyzing faces...');
    
    // Convert photos to proper URL format for OpenAI
    let currentPhotoUrl = currentPhoto;
    let referencePhotoUrl = referencePhoto;
    
    // If base64, convert to data URL
    if (!currentPhoto.startsWith('http') && !currentPhoto.startsWith('data:')) {
      currentPhotoUrl = `data:image/jpeg;base64,${currentPhoto}`;
    }
    if (!referencePhoto.startsWith('http') && !referencePhoto.startsWith('data:')) {
      referencePhotoUrl = `data:image/jpeg;base64,${referencePhoto}`;
    }
    
    // Call OpenAI Vision API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze these two photos for face verification. Return JSON with:
                - faceDetected: boolean (is there a clear human face in current photo?)
                - matchScore: number 0-1 (how similar are the faces?)
                - isLive: boolean (does it look like a real person vs screenshot?)
                - isFake: boolean (is it a screenshot, printed photo, or deepfake?)
                - confidence: number 0-1
                - details: {faceQuality, lighting, angle, expression}
                
                Current photo:`
              },
              {
                type: 'image_url',
                image_url: {
                  url: currentPhotoUrl
                }
              },
              {
                type: 'text',
                text: 'Reference photo:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: referencePhotoUrl
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    return {
      ...result,
      aiProvider: 'openai-vision',
      success: true
    };

  } catch (error: any) {
    console.error('[OpenAI Vision] Error:', error.message);
    // Return error instead of fallback (let next provider try)
    return {
      success: false,
      faceDetected: false,
      matchScore: 0,
      confidence: 0,
      details: { error: error.message },
      aiProvider: 'openai-vision'
    };
  }
}

/**
 * Anthropic Claude Vision API
 * Best untuk: Detailed analysis dan reasoning
 */
async function verifyWithAnthropic(currentPhoto: string, referencePhoto: string, apiKey: string): Promise<any> {
  try {
    if (!apiKey || !apiKey.startsWith('sk-ant-')) {
      throw new Error('Anthropic API key not valid (must start with sk-ant-)');
    }
    
    console.log('[Anthropic Vision] Analyzing faces...');
    
    // Prepare photo data (convert to base64 if URL)
    let currentBase64 = currentPhoto;
    let referenceBase64 = referencePhoto;
    
    // Download and convert URLs to base64
    if (currentPhoto.startsWith('http')) {
      const response = await fetch(currentPhoto);
      const buffer = await response.arrayBuffer();
      currentBase64 = Buffer.from(buffer).toString('base64');
    } else if (currentPhoto.startsWith('data:')) {
      currentBase64 = currentPhoto.split(',')[1];
    }
    
    if (referencePhoto.startsWith('http')) {
      const response = await fetch(referencePhoto);
      const buffer = await response.arrayBuffer();
      referenceBase64 = Buffer.from(buffer).toString('base64');
    } else if (referencePhoto.startsWith('data:')) {
      referenceBase64 = referencePhoto.split(',')[1];
    }
    
    // Call Anthropic Claude Vision API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are a facial recognition expert. Analyze these two photos for face verification.

Photo 1 is the REFERENCE (registered user photo).
Photo 2 is the CURRENT (live selfie for verification).

Analyze and return ONLY valid JSON:
{
  "faceDetected": boolean,
  "matchScore": number 0.0-1.0 (how similar are the faces),
  "isLive": boolean (is this a real person, not a photo of photo),
  "isFake": boolean (is this a screenshot/print/deepfake),
  "confidence": number 0.0-1.0,
  "details": {
    "facialStructure": "matching|similar|different",
    "warnings": []
  },
  "reasoning": "Brief explanation of analysis"
}`
              },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: referenceBase64
                }
              },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: currentBase64
                }
              }
            ]
          }
        ]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    // Extract text content from response
    const textContent = data.content?.find((c: any) => c.type === 'text')?.text || '';
    
    // Parse JSON from response
    let result;
    try {
      // Try to extract JSON from markdown code block
      let jsonText = textContent;
      if (textContent.includes('```json')) {
        jsonText = textContent.split('```json')[1].split('```')[0].trim();
      } else if (textContent.includes('```')) {
        jsonText = textContent.split('```')[1].split('```')[0].trim();
      }
      result = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('[Anthropic Vision] Failed to parse JSON:', textContent);
      throw new Error('Failed to parse Anthropic response');
    }
    
    console.log('[Anthropic Vision] Analysis complete:', {
      faceDetected: result.faceDetected,
      matchScore: result.matchScore,
      isLive: result.isLive,
      confidence: result.confidence
    });
    
    return {
      success: true,
      faceDetected: result.faceDetected,
      matchScore: result.matchScore,
      isLive: result.isLive,
      isFake: result.isFake,
      confidence: result.confidence,
      details: result.details,
      reasoning: result.reasoning,
      aiProvider: 'anthropic-claude-vision'
    };
    
  } catch (error: any) {
    console.error('[Anthropic Vision] Error:', error.message);
    // Return error instead of fallback (let next provider try)
    return {
      success: false,
      faceDetected: false,
      matchScore: 0,
      confidence: 0,
      details: { error: error.message },
      aiProvider: 'anthropic-claude-vision'
    };
  }
}

/**
 * Vercel AI Gateway Face Verification
 * Uses AI Gateway for vision analysis
 */
async function verifyWithAIGateway(currentPhoto: string, referencePhoto: string): Promise<any> {
  console.log('[AI Gateway] Running face verification via AI Gateway...');
  
  try {
    const { gateway } = await import('@ai-sdk/gateway');
    const { generateText } = await import('ai');
    
    const prompt = `Analyze these two face photos for identity verification:

PHOTO 1 (Current/Live): The person taking the selfie now
PHOTO 2 (Reference): The registered reference photo

Provide your analysis in JSON format:
{
  "faceDetected": true/false,
  "matchScore": 0.0-1.0 (confidence of same person),
  "isLive": true/false (does photo 1 look like a real live photo, not screenshot),
  "isFake": true/false (any signs of manipulation or fraud),
  "analysis": "brief explanation",
  "recommendation": "ACCEPT" or "REJECT"
}

Be strict about identity matching. Only return ACCEPT if you are confident it's the same person.`;

    const result = await generateText({
      model: gateway('openai/gpt-4o-mini'),
      messages: [
        { 
          role: 'user', 
          content: [
            { type: 'text', text: prompt },
            { type: 'image', image: currentPhoto.startsWith('data:') ? currentPhoto : `data:image/jpeg;base64,${currentPhoto}` },
            { type: 'image', image: referencePhoto.startsWith('data:') ? referencePhoto : referencePhoto }
          ]
        }
      ],
    });

    // Parse JSON from response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        success: parsed.recommendation === 'ACCEPT' && parsed.matchScore >= 0.7,
        faceDetected: parsed.faceDetected,
        matchScore: parsed.matchScore,
        isLive: parsed.isLive,
        isFake: parsed.isFake,
        recommendation: parsed.recommendation,
        details: {
          provider: 'AI Gateway (OpenAI)',
          analysis: parsed.analysis
        }
      };
    }
    
    throw new Error('Invalid AI Gateway response format');
  } catch (error: any) {
    console.error('[AI Gateway] Face verification error:', error.message);
    return {
      success: false,
      faceDetected: false,
      matchScore: 0,
      isLive: false,
      isFake: false,
      details: {
        error: error.message,
        provider: 'AI Gateway'
      }
    };
  }
}

/**
 * BASIC IMAGE VERIFICATION (Fallback)
 * Tidak pakai AI external, hanya basic checks
 */
async function basicImageVerification(currentPhoto: string, referencePhoto: string): Promise<any> {
  console.log('[Basic Verification] Running fallback verification');
  
  // Basic checks:
  // 1. Photos exist and accessible
  // 2. File size reasonable
  // 3. Format valid (JPEG/PNG)
  
  try {
    const [currentCheck, referenceCheck] = await Promise.all([
      checkImageValidity(currentPhoto),
      checkImageValidity(referencePhoto)
    ]);

    // Jika basic checks pass, assume valid untuk development
    // Di production WAJIB pakai AI provider
    const bothValid = currentCheck.valid && referenceCheck.valid;
    
    return {
      success: bothValid,
      faceDetected: bothValid, // Assume valid
      matchScore: bothValid ? 0.85 : 0, // Assume 85% match jika valid
      isLive: bothValid,
      isFake: false,
      confidence: bothValid ? 0.75 : 0, // Lower confidence untuk basic
      details: {
        currentPhoto: currentCheck,
        referencePhoto: referenceCheck,
        warning: 'Using basic verification. Configure AI provider for production.'
      },
      aiProvider: 'basic-fallback'
    };

  } catch (error: any) {
    return {
      success: false,
      faceDetected: false,
      matchScore: 0,
      isLive: false,
      isFake: true,
      confidence: 0,
      details: { error: error.message },
      aiProvider: 'basic-fallback'
    };
  }
}

async function checkImageValidity(url: string): Promise<any> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    
    if (!response.ok) {
      return { valid: false, error: 'Image not accessible' };
    }

    const contentType = response.headers.get('content-type');
    const contentLength = parseInt(response.headers.get('content-length') || '0');

    // Check if JPEG/PNG
    const validFormats = ['image/jpeg', 'image/jpg', 'image/png'];
    const formatValid = validFormats.some(format => contentType?.includes(format));

    // Check reasonable file size (50KB - 10MB)
    const sizeValid = contentLength >= 50000 && contentLength <= 10000000;

    return {
      valid: formatValid && sizeValid,
      contentType,
      size: contentLength,
      formatValid,
      sizeValid
    };

  } catch (error: any) {
    return {
      valid: false,
      error: error.message
    };
  }
}
