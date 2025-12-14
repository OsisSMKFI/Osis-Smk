/**
 * Vercel Integration Health Check
 * Run this script to verify all Vercel services are configured correctly
 * 
 * Usage: node scripts/check-vercel-services.js
 */

const https = require('https');
const http = require('http');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bold}${msg}${colors.reset}`),
};

async function checkEnvVar(name, description, isSecret = false) {
  const value = process.env[name];
  if (value) {
    const displayValue = isSecret ? value.substring(0, 10) + '...' : value;
    log.success(`${name}: ${displayValue}`);
    return true;
  } else {
    log.error(`${name}: Not set (${description})`);
    return false;
  }
}

async function checkVercelAnalytics() {
  log.header('📊 Vercel Analytics');
  
  try {
    // Check if @vercel/analytics is installed
    require('@vercel/analytics');
    log.success('@vercel/analytics package installed');
    return true;
  } catch (e) {
    log.error('@vercel/analytics package not installed');
    return false;
  }
}

async function checkAIGateway() {
  log.header('🤖 Vercel AI Gateway');
  
  const hasKey = await checkEnvVar(
    'AI_GATEWAY_API_KEY', 
    'Required for AI Gateway', 
    true
  );
  
  const hasAltKey = await checkEnvVar(
    'VERCEL_AI_API_KEY', 
    'Alternative key for AI Gateway', 
    true
  );
  
  try {
    require('ai');
    log.success('ai (AI SDK) package installed');
  } catch (e) {
    log.error('ai (AI SDK) package not installed');
  }
  
  try {
    require('@ai-sdk/openai');
    log.success('@ai-sdk/openai package installed');
  } catch (e) {
    log.warn('@ai-sdk/openai package not installed');
  }
  
  try {
    require('@ai-sdk/anthropic');
    log.success('@ai-sdk/anthropic package installed');
  } catch (e) {
    log.warn('@ai-sdk/anthropic package not installed');
  }
  
  try {
    require('@ai-sdk/google');
    log.success('@ai-sdk/google package installed');
  } catch (e) {
    log.warn('@ai-sdk/google package not installed');
  }
  
  return hasKey || hasAltKey;
}

async function checkEdgeConfig() {
  log.header('⚡ Vercel Edge Config');
  
  const hasConfig = await checkEnvVar(
    'EDGE_CONFIG', 
    'Edge Config connection string',
    true
  );
  
  try {
    require('@vercel/edge-config');
    log.success('@vercel/edge-config package installed');
  } catch (e) {
    log.error('@vercel/edge-config package not installed');
    return false;
  }
  
  return hasConfig;
}

async function checkBlobStore() {
  log.header('📦 Vercel Blob Store');
  
  const hasToken = await checkEnvVar(
    'BLOB_READ_WRITE_TOKEN', 
    'Blob Store access token',
    true
  );
  
  try {
    require('@vercel/blob');
    log.success('@vercel/blob package installed');
  } catch (e) {
    log.error('@vercel/blob package not installed');
    return false;
  }
  
  return hasToken;
}

async function checkTurso() {
  log.header('🗄️ Turso Database');
  
  const hasUrl = await checkEnvVar(
    'TURSO_DATABASE_URL', 
    'Turso database URL'
  );
  
  const hasToken = await checkEnvVar(
    'TURSO_AUTH_TOKEN', 
    'Turso auth token',
    true
  );
  
  try {
    require('@libsql/client');
    log.success('@libsql/client package installed');
  } catch (e) {
    log.error('@libsql/client package not installed');
    return false;
  }
  
  return hasUrl && hasToken;
}

async function checkSupabase() {
  log.header('🔐 Supabase');
  
  const hasUrl = await checkEnvVar(
    'NEXT_PUBLIC_SUPABASE_URL', 
    'Supabase project URL'
  );
  
  const hasAnonKey = await checkEnvVar(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
    'Supabase anon key',
    true
  );
  
  const hasServiceKey = await checkEnvVar(
    'SUPABASE_SERVICE_ROLE_KEY', 
    'Supabase service role key',
    true
  );
  
  return hasUrl && hasAnonKey && hasServiceKey;
}

async function checkNextAuth() {
  log.header('🔑 NextAuth');
  
  const hasSecret = await checkEnvVar(
    'NEXTAUTH_SECRET', 
    'NextAuth secret key',
    true
  );
  
  const hasUrl = await checkEnvVar(
    'NEXTAUTH_URL', 
    'NextAuth URL'
  );
  
  return hasSecret && hasUrl;
}

async function main() {
  console.log(`
${colors.bold}╔══════════════════════════════════════════════════════╗
║      Vercel Integration Health Check                 ║
║      OSIS SMK Informatika - Dirgantara 2025          ║
╚══════════════════════════════════════════════════════╝${colors.reset}
`);

  const results = {
    analytics: await checkVercelAnalytics(),
    aiGateway: await checkAIGateway(),
    edgeConfig: await checkEdgeConfig(),
    blobStore: await checkBlobStore(),
    turso: await checkTurso(),
    supabase: await checkSupabase(),
    nextAuth: await checkNextAuth(),
  };

  log.header('📋 Summary');
  
  const services = [
    { name: 'Vercel Analytics', ready: results.analytics },
    { name: 'AI Gateway', ready: results.aiGateway },
    { name: 'Edge Config', ready: results.edgeConfig },
    { name: 'Blob Store', ready: results.blobStore },
    { name: 'Turso Database', ready: results.turso },
    { name: 'Supabase', ready: results.supabase },
    { name: 'NextAuth', ready: results.nextAuth },
  ];

  let readyCount = 0;
  services.forEach(({ name, ready }) => {
    if (ready) {
      log.success(`${name}: Ready for deployment`);
      readyCount++;
    } else {
      log.warn(`${name}: Needs configuration`);
    }
  });

  console.log(`
${colors.bold}Result: ${readyCount}/${services.length} services ready${colors.reset}
`);

  if (readyCount === services.length) {
    console.log(`${colors.green}${colors.bold}🚀 All services configured! Ready to deploy to Vercel.${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.yellow}${colors.bold}⚠️  Some services need configuration before deployment.${colors.reset}`);
    console.log('\nTo configure missing services:');
    console.log('1. Go to your Vercel Dashboard');
    console.log('2. Navigate to Storage and add missing services');
    console.log('3. Copy the environment variables to .env.local');
    console.log('4. Run this check again: node scripts/check-vercel-services.js\n');
    process.exit(1);
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

main().catch(console.error);
