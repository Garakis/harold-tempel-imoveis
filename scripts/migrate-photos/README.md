# Photo migration script

Downloads every property photo from `imgs.kenlo.io` and re-uploads to the
Supabase Storage bucket `property-photos`. Updates the `property_photos`
table so `public_url` points to Supabase and `storage_path` becomes the
storage object path.

**Run before cancelling the Kenlo subscription.** Photos from
`imgs.kenlo.io` will become inaccessible once the Kenlo account is closed,
so you must mirror them locally first.

## Usage

```bash
cd web
npx tsx scripts/migrate-photos/download-photos.ts
```

The script is idempotent — it only processes rows whose `storage_path`
still begins with `kenlo:` (the marker we set during initial import).
Re-run it to retry failures.

## Storage layout

```
property-photos/
├── CA0001/
│   ├── 000.jpg   ← cover
│   ├── 001.jpg
│   └── …
├── CA0002/
│   └── …
└── …
```

## Estimating size

55 properties × ~15 photos × ~200KB each ≈ **165 MB**. Free Supabase tier
has 1 GB storage — comfortable headroom.

## Tuning

- `CONCURRENCY` (default 5) — number of simultaneous downloads/uploads
- Adjust if you hit Supabase rate limits
