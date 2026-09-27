/**
 * Ambil satu frame dari video sebagai Blob (JPEG).
 * Dipakai admin galeri utk auto-poster saat upload video & tombol "ambil frame".
 *
 * src : objectURL (file lokal) atau URL publik video (Supabase storage)
 * atSeconds : waktu frame (default ±25% durasi, dibatasi 0.1–2 detik)
 */
export async function captureVideoFrameBlob(
  src: string,
  atSeconds?: number
): Promise<Blob | null> {
  if (!src || typeof document === 'undefined') return null;

  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    // Remote storage perlu CORS biar canvas tidak "tainted"
    if (!src.startsWith('blob:') && !src.startsWith('data:')) {
      video.crossOrigin = 'anonymous';
    }
    video.src = src;

    let settled = false;
    const finish = (blob: Blob | null) => {
      if (settled) return;
      settled = true;
      try {
        video.removeAttribute('src');
        video.load();
      } catch {
        // noop
      }
      resolve(blob);
    };

    const grab = () => {
      if (settled) return;
      try {
        const w = video.videoWidth;
        const h = video.videoHeight;
        if (!w || !h) {
          finish(null);
          return;
        }
        // Maksimum 1280px sisi terpanjang (cukup utk preview share)
        const scale = Math.min(1, 1280 / Math.max(w, h));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          finish(null);
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => finish(blob), 'image/jpeg', 0.85);
      } catch {
        // SecurityError jika video tanpa CORS → fallback dicoba di caller
        finish(null);
      }
    };

    video.addEventListener(
      'loadeddata',
      () => {
        try {
          const dur = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
          const target =
            atSeconds !== undefined
              ? atSeconds
              : dur > 0
                ? Math.min(Math.max(dur * 0.25, 0.1), 2)
                : 0;
          const clamped = dur > 0 ? Math.min(target, Math.max(dur - 0.05, 0)) : target;
          if (clamped > 0) {
            video.currentTime = clamped;
          } else {
            grab();
          }
        } catch {
          grab();
        }
      },
      { once: true }
    );

    video.addEventListener('seeked', grab, { once: true });
    video.addEventListener('error', () => finish(null), { once: true });

    // Backstop: jangan biarkan promise menggantung
    setTimeout(() => finish(null), 12000);
  });
}
