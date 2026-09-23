/**
 * Shared proker (program_kerja) helpers.
 * DB schema uses: nama, waktu, status, progress, penanggung_jawab, tujuan, ...
 * Admin/public UI uses: title, description, start_date, end_date, status
 */

export type ProkerStatus = 'planned' | 'ongoing' | 'completed' | 'cancelled';

/** Statuses allowed by the bootstrap CHECK constraint on program_kerja.status */
const DB_ALLOWED_STATUS = new Set(['planned', 'ongoing', 'completed']);

export interface ProkerApiShape {
  id: string | number;
  title: string;
  description: string | null;
  sekbid_id: number | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  progress?: number;
  created_at?: string;
  updated_at?: string;
  waktu?: string | null;
  nama?: string;
  sekbid?: { id: number; name: string; [k: string]: unknown } | null;
  [key: string]: unknown;
}

function toDateOnly(value: unknown): string | null {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  // "2026-01-01" or "2026-01-01T00:00:00"
  const datePart = trimmed.split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

/** Parse legacy `waktu` text: "start - end" or single date */
export function parseWaktu(waktu: unknown): { start_date: string | null; end_date: string | null } {
  if (!waktu || typeof waktu !== 'string') return { start_date: null, end_date: null };
  const raw = waktu.trim();
  if (!raw) return { start_date: null, end_date: null };

  // Prefer " - " separator (what admin API writes)
  if (raw.includes(' - ')) {
    const [a, b] = raw.split(' - ');
    return { start_date: toDateOnly(a), end_date: toDateOnly(b) };
  }
  // Fallback: two date-like tokens
  const parts = raw.split(/\s+to\s+|\s*\/\s*|\s*,\s*/i).map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { start_date: toDateOnly(parts[0]), end_date: toDateOnly(parts[1]) };
  }
  return { start_date: toDateOnly(raw), end_date: null };
}

/** Map a DB row → API/UI shape */
export function mapProkerRow(row: any): ProkerApiShape {
  if (!row) return row;
  const fromWaktu = parseWaktu(row.waktu);
  const title = row.title || row.nama || '';
  const description =
    row.description ??
    row.tujuan ??
    row.dasar_pemikiran ??
    null;

  return {
    ...row,
    id: row.id,
    title,
    nama: row.nama || title,
    description: description || null,
    sekbid_id: row.sekbid_id ?? null,
    start_date: toDateOnly(row.start_date) || fromWaktu.start_date,
    end_date: toDateOnly(row.end_date) || fromWaktu.end_date,
    status: row.status || 'planned',
    progress: typeof row.progress === 'number' ? row.progress : 0,
  };
}

export function mapProkerList(rows: any[] | null | undefined): ProkerApiShape[] {
  return (rows || []).map(mapProkerRow);
}

/**
 * Build a DB insert/update payload from admin form body.
 * Only includes columns known to exist on the bootstrap schema,
 * plus optional columns if the caller passes hasColumns probe results.
 */
export function buildProkerDbPayload(
  body: {
    title?: string;
    description?: string | null;
    sekbid_id?: number | null;
    start_date?: string | null;
    end_date?: string | null;
    status?: string;
    progress?: number | null;
  },
  opts?: {
    /** true if `description` column exists on program_kerja */
    hasDescriptionColumn?: boolean;
    /** true if start_date/end_date columns exist */
    hasDateColumns?: boolean;
    /** true if status CHECK allows 'cancelled' */
    allowsCancelled?: boolean;
  }
): Record<string, unknown> {
  const title = (body.title || '').trim();
  const status = (body.status || 'planned') as ProkerStatus;

  let effectiveStatus = status;
  if (opts?.allowsCancelled === false && status === 'cancelled') {
    effectiveStatus = 'planned';
  }
  if (!DB_ALLOWED_STATUS.has(effectiveStatus) && opts?.allowsCancelled !== true) {
    // Unknown/unsupported → keep within bootstrap CHECK
    effectiveStatus = DB_ALLOWED_STATUS.has(status) ? status : 'planned';
  }
  if (opts?.allowsCancelled === true && status === 'cancelled') {
    effectiveStatus = 'cancelled';
  }

  const start = toDateOnly(body.start_date);
  const end = toDateOnly(body.end_date);
  const waktu =
    [start, end].filter(Boolean).join(' - ') ||
    (start || end ? (start || end) : null);

  const payload: Record<string, unknown> = {
    nama: title,
    sekbid_id: body.sekbid_id ?? null,
    waktu,
    status: effectiveStatus,
    updated_at: new Date().toISOString(),
  };

  if (typeof body.progress === 'number' && body.progress >= 0 && body.progress <= 100) {
    payload.progress = body.progress;
  }

  if (opts?.hasDateColumns) {
    payload.start_date = start;
    payload.end_date = end;
  }

  if (opts?.hasDescriptionColumn) {
    payload.description = body.description || null;
  } else if (body.description) {
    // Fallback: store free-text description in `tujuan` when description column is missing
    payload.tujuan = body.description;
  }

  return payload;
}

/** Detect optional columns by probing one existing row (and error messages on write). */
export async function detectProkerColumns(
  supabaseAdmin: any
): Promise<{ hasDescriptionColumn: boolean; hasDateColumns: boolean; allowsCancelled: boolean }> {
  let hasDescriptionColumn = false;
  let hasDateColumns = false;
  let allowsCancelled = true;

  try {
    const { data: sample } = await supabaseAdmin
      .from('program_kerja')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (sample && typeof sample === 'object') {
      hasDescriptionColumn = 'description' in sample;
      hasDateColumns = 'start_date' in sample && 'end_date' in sample;
    } else {
      // Empty table: assume bootstrap schema (no description / date cols)
      hasDescriptionColumn = false;
      hasDateColumns = false;
    }

    // Probe status CHECK by checking a cancelled row OR a lightweight dry attempt is too costly;
    // bootstrap schema disallows cancelled. Only enable if a cancelled row already exists.
    const { data: cancelledRow } = await supabaseAdmin
      .from('program_kerja')
      .select('id, status')
      .eq('status', 'cancelled')
      .limit(1)
      .maybeSingle();
    allowsCancelled = !!cancelledRow || hasDescriptionColumn === true; // if schema was extended, likely also status
  } catch {
    // Defaults match bootstrap SQL
    hasDescriptionColumn = false;
    hasDateColumns = false;
    allowsCancelled = false;
  }

  return { hasDescriptionColumn, hasDateColumns, allowsCancelled };
}

function isMissingColumnOrStatusError(error: { message?: string; code?: string }): boolean {
  const msg = (error.message || '').toLowerCase();
  const code = error.code || '';
  return (
    code === 'PGRST204' ||
    code === '23514' ||
    msg.includes('does not exist') ||
    msg.includes('column') ||
    msg.includes('check constraint') ||
    msg.includes('violates check') ||
    (msg.includes('description') && msg.includes('program_kerja')) ||
    msg.includes('start_date') ||
    msg.includes('end_date') ||
    (msg.includes('status') && (msg.includes('check') || msg.includes('violates')))
  );
}

/**
 * Insert: try the richer payload first (description/dates/cancelled if DB supports them),
 * then fall back to bootstrap-safe columns.
 */
export async function insertProkerSafe(
  supabaseAdmin: any,
  body: Parameters<typeof buildProkerDbPayload>[0]
) {
  const preferred = buildProkerDbPayload(body, {
    hasDescriptionColumn: true,
    hasDateColumns: true,
    allowsCancelled: true,
  });

  let result = await supabaseAdmin
    .from('program_kerja')
    .insert(preferred)
    .select()
    .single();

  if (result.error && isMissingColumnOrStatusError(result.error)) {
    const bootstrap = buildProkerDbPayload(body, {
      hasDescriptionColumn: false,
      hasDateColumns: false,
      allowsCancelled: false,
    });
    result = await supabaseAdmin
      .from('program_kerja')
      .insert(bootstrap)
      .select()
      .single();

    if (result.error && (result.error.message || '').toLowerCase().includes('tujuan')) {
      delete bootstrap.tujuan;
      result = await supabaseAdmin
        .from('program_kerja')
        .insert(bootstrap)
        .select()
        .single();
    }
  }

  return result;
}

/** Update: try richer payload first, then bootstrap-safe fallback */
export async function updateProkerSafe(
  supabaseAdmin: any,
  id: string | number,
  body: Parameters<typeof buildProkerDbPayload>[0]
) {
  const preferred = buildProkerDbPayload(body, {
    hasDescriptionColumn: true,
    hasDateColumns: true,
    allowsCancelled: true,
  });

  let result = await supabaseAdmin
    .from('program_kerja')
    .update(preferred)
    .eq('id', id)
    .select()
    .single();

  if (result.error && isMissingColumnOrStatusError(result.error)) {
    const bootstrap = buildProkerDbPayload(body, {
      hasDescriptionColumn: false,
      hasDateColumns: false,
      allowsCancelled: false,
    });
    result = await supabaseAdmin
      .from('program_kerja')
      .update(bootstrap)
      .eq('id', id)
      .select()
      .single();

    if (result.error && (result.error.message || '').toLowerCase().includes('tujuan')) {
      delete bootstrap.tujuan;
      result = await supabaseAdmin
        .from('program_kerja')
        .update(bootstrap)
        .eq('id', id)
        .select()
        .single();
    }
  }

  return result;
}
