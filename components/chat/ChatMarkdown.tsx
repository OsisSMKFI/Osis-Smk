import React from 'react';

/**
 * Renderer markdown ringan untuk bubble chat (tanpa dependency).
 * Menangani: heading (#), bold (**), italic (*), inline code (`),
 * link [teks](url), bullet (-/* •), numbered list (1.), garis (---),
 * dan TABEL markdown → diubah jadi daftar bullet (tidak berantakan di HP).
 * Semua output berupa React nodes (aman XSS, tanpa dangerouslySetInnerHTML).
 */

function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*\n]+\*|\[[^\]]+\]\([^)\s]+\)|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('**')) {
      nodes.push(<strong key={`b${k++}`} className="font-semibold text-slate-900 dark:text-white">{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith('[')) {
      const mm = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(tok);
      if (mm) {
        nodes.push(
          <a key={`a${k++}`} href={mm[2]} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 underline underline-offset-2 break-all">
            {mm[1]}
          </a>
        );
      } else {
        nodes.push(tok);
      }
    } else if (tok.startsWith('`')) {
      nodes.push(
        <code key={`c${k++}`} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[12px] font-mono">
          {tok.slice(1, -1)}
        </code>
      );
    } else {
      nodes.push(<em key={`i${k++}`}>{tok.slice(1, -1)}</em>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

const isTableRow = (l: string) => /^\s*\|.*\|\s*$/.test(l);
const isTableSep = (l: string) => {
  const body = l.trim().replace(/^\||\|$/g, '');
  const cells = body.split('|').map((c) => c.trim());
  return cells.length > 0 && cells.every((c) => /^:?-{2,}:?$/.test(c));
};

export default function ChatMarkdown({ text }: { text: string }) {
  const lines = (text || '').replace(/\r/g, '').split('\n');
  const out: React.ReactNode[] = [];
  let i = 0;
  let k = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Heading
    if (/^#{1,6}\s+/.test(line)) {
      out.push(
        <div key={k++} className="font-bold text-[15px] mt-1.5 mb-0.5 text-slate-900 dark:text-white">
          {renderInline(line.replace(/^#{1,6}\s+/, ''))}
        </div>
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      out.push(<hr key={k++} className="my-2 border-slate-200/80 dark:border-slate-600/60" />);
      i++;
      continue;
    }

    // Tabel markdown → daftar bullet (aman di layar sempit)
    if (isTableRow(line)) {
      const rows: string[][] = [];
      while (i < lines.length && isTableRow(lines[i])) {
        if (!isTableSep(lines[i])) {
          rows.push(lines[i].trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
        }
        i++;
      }
      const header = rows[0] || [];
      const body = rows.slice(1);
      if (body.length) {
        out.push(
          <div key={k++} className="my-1.5 space-y-1">
            {body.map((r, ri) => (
              <div key={ri} className="flex gap-1.5">
                <span className="text-indigo-500 flex-shrink-0 select-none">•</span>
                <span>
                  {r
                    .map((c, ci) => (header[ci] ? `${header[ci]}: ${c}` : c))
                    .filter(Boolean)
                    .map((part, pi) => (
                      <React.Fragment key={pi}>
                        {pi > 0 && <span className="text-slate-400 dark:text-slate-500"> · </span>}
                        {renderInline(part)}
                      </React.Fragment>
                    ))}
                </span>
              </div>
            ))}
          </div>
        );
      }
      continue;
    }

    // Numbered list
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const num = line.match(/^\s*(\d+)[.)]\s+/)![1];
      out.push(
        <div key={k++} className="flex gap-1.5">
          <span className="flex-shrink-0 font-medium text-indigo-500 select-none">{num}.</span>
          <span>{renderInline(line.replace(/^\s*\d+[.)]\s+/, ''))}</span>
        </div>
      );
      i++;
      continue;
    }

    // Bullet list
    if (/^\s*[-*•]\s+/.test(line)) {
      out.push(
        <div key={k++} className="flex gap-1.5">
          <span className="flex-shrink-0 text-indigo-500 select-none">•</span>
          <span>{renderInline(line.replace(/^\s*[-*•]\s+/, ''))}</span>
        </div>
      );
      i++;
      continue;
    }

    // Baris kosong → jarak antar bagian
    if (line.trim() === '') {
      out.push(<div key={k++} className="h-1.5" />);
      i++;
      continue;
    }

    // Baris biasa
    out.push(<div key={k++}>{renderInline(line)}</div>);
    i++;
  }

  return <div className="space-y-0.5 min-w-0">{out}</div>;
}
