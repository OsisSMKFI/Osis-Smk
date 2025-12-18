# OG Images untuk WhatsApp

Folder ini berisi gambar OG (Open Graph) statis untuk kompatibilitas WhatsApp.

## Requirement WhatsApp:

- **Format**: JPEG atau PNG (JPEG lebih direkomendasikan)
- **Ukuran**: 1200 x 630 pixel
- **File Size**: < 300KB
- **URL**: Tanpa query params (static file)

## Gambar yang Perlu Dibuat:

### Default
- `default.jpg` - Fallback image untuk semua halaman

### Sekbid (Seksi Bidang)
- `sekbid-1.jpg` - Sekbid 1: Keagamaan
- `sekbid-2.jpg` - Sekbid 2: Kaderisasi
- `sekbid-3.jpg` - Sekbid 3: Akademik
- `sekbid-4.jpg` - Sekbid 4: Olahraga & Kewirausahaan
- `sekbid-5.jpg` - Sekbid 5: Kesehatan & Lingkungan
- `sekbid-6.jpg` - Sekbid 6: Publikasi & Dokumentasi

### Halaman Statis
- `home.jpg` - Halaman utama
- `about.jpg` - Tentang OSIS
- `posts.jpg` - Daftar berita
- `gallery.jpg` - Galeri foto
- `people.jpg` - Anggota OSIS
- `sekbid.jpg` - Daftar sekbid
- `info.jpg` - Info & Event

## Tools untuk Generate:

1. **Canva** - Template OG 1200x630
2. **Figma** - Design tool
3. **Dynamic OG API** - `/api/og?title=...&type=...` (untuk reference)

## Cara Generate Cepat:

```bash
# Screenshot dari Dynamic OG API, lalu compress
curl "https://osissmktest.biezz.my.id/api/og?title=Sekbid%201%20Keagamaan&type=sekbid" -o sekbid-1.png
# Lalu convert ke JPEG dan compress < 300KB
```
