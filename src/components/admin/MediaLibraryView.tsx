import React, { useState, useMemo } from 'react';
import {
  Images,
  Upload,
  Search,
  Trash2,
  Copy,
  FileImage,
} from 'lucide-react';
import { publicMediaUrl } from '../../lib/supabase';

interface MediaLibraryViewProps {
  media: any[];
  products: any[];
  sections: any[];
  onUploadFile: (file: File, purpose: string) => Promise<any>;
  onDeleteAsset: (assetId: string) => Promise<void>;
}

export default function MediaLibraryView({
  media,
  products,
  sections,
  onUploadFile,
  onDeleteAsset,
}: MediaLibraryViewProps) {
  const [search, setSearch] = useState('');
  const [purposeFilter, setPurposeFilter] = useState('all');
  const [uploadPurpose, setUploadPurpose] = useState('product');
  const [uploadProgress, setUploadProgress] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Compute reference counts for each media asset
  const referenceCounts = useMemo(() => {
    const counts = new Map<string, number>();

    // Check product media
    for (const p of products) {
      for (const m of p.product_media || []) {
        const id = m.asset_id || m.media_assets?.id;
        if (id) counts.set(id, (counts.get(id) || 0) + 1);
      }
    }

    // Check homepage sections
    for (const s of sections) {
      if (s.desktop_asset_id) {
        counts.set(s.desktop_asset_id, (counts.get(s.desktop_asset_id) || 0) + 1);
      }
      if (s.mobile_asset_id) {
        counts.set(s.mobile_asset_id, (counts.get(s.mobile_asset_id) || 0) + 1);
      }
    }

    return counts;
  }, [products, sections]);

  // Filtered media
  const filteredMedia = useMemo(() => {
    return media.filter((item) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = item.original_filename?.toLowerCase().includes(q);
        const matchesPurpose = item.purpose?.toLowerCase().includes(q);
        if (!matchesName && !matchesPurpose) return false;
      }

      if (purposeFilter !== 'all') {
        if (purposeFilter === 'product' && item.purpose !== 'product') return false;
        if (purposeFilter === 'banner' && item.purpose !== 'homepage_hero' && item.purpose !== 'campaign')
          return false;
        if (purposeFilter === 'collection' && item.purpose !== 'collection' && item.purpose !== 'category')
          return false;
        if (purposeFilter === 'story' && item.purpose !== 'brand_story' && item.purpose !== 'lookbook')
          return false;
      }

      return true;
    });
  }, [media, search, purposeFilter]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadProgress(`Uploading ${files.length} file(s)...`);
    try {
      for (let i = 0; i < files.length; i++) {
        setUploadProgress(`Uploading "${files[i].name}" (${i + 1}/${files.length})...`);
        await onUploadFile(files[i], uploadPurpose);
      }
      setUploadProgress('Upload complete!');
      setTimeout(() => setUploadProgress(''), 3000);
    } catch (err: any) {
      setUploadProgress(`Upload error: ${err.message}`);
    }
  };

  const copyUrl = (asset: any) => {
    const url = publicMediaUrl(asset, 1600);
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedId(asset.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (asset: any) => {
    const refs = referenceCounts.get(asset.id) || 0;
    if (refs > 0) {
      if (
        !window.confirm(
          `This photo is currently used in ${refs} place(s) in your store. Deleting it will leave those slots empty. Proceed?`
        )
      ) {
        return;
      }
    } else {
      if (!window.confirm(`Permanently delete "${asset.original_filename || 'this photo'}"?`)) {
        return;
      }
    }
    await onDeleteAsset(asset.id);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="font-serif text-2xl font-bold text-ink">Photos & Uploads</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Cloud-hosted media library powered by ImageKit with fast global image delivery
          </p>
        </div>
      </div>

      {/* UPLOAD DROPZONE */}
      <div className="bg-white rounded-2xl border border-[#E8E2D9] p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8E2D9]">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-clay" />
            <span className="font-serif font-bold text-sm text-ink">Upload New Photographs</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-ink-muted">Assign Purpose:</span>
            <select
              value={uploadPurpose}
              onChange={(e) => setUploadPurpose(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-[#FAF7F0] border border-[#E8E2D9] text-ink font-medium"
            >
              <option value="product">Product Photography</option>
              <option value="homepage_hero">Homepage & Hero Banners</option>
              <option value="collection">Collections & Lookbook</option>
              <option value="category">Category Card</option>
              <option value="brand_story">Brand Story & About</option>
            </select>
          </div>
        </div>

        <div className="border-2 border-dashed border-[#E8E2D9] hover:border-clay/60 bg-[#FAF7F0] rounded-xl p-6 text-center transition">
          <label className="cursor-pointer inline-flex flex-col items-center">
            <Images className="w-8 h-8 text-clay mb-2" />
            <span className="text-xs font-semibold text-ink">Click to select files or drag here</span>
            <span className="text-[11px] text-ink-muted mt-0.5">
              JPG, PNG, WebP up to 10MB each
            </span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
          </label>
          {uploadProgress && (
            <p className="text-xs font-medium text-clay mt-3 animate-pulse">{uploadProgress}</p>
          )}
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="bg-white rounded-2xl border border-[#E8E2D9] p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            placeholder="Search filenames or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9] focus:outline-none focus:border-clay"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'all', label: 'All Photos' },
            { id: 'product', label: 'Product Photos' },
            { id: 'banner', label: 'Banners & Hero' },
            { id: 'collection', label: 'Collections' },
            { id: 'story', label: 'Brand Story' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPurposeFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                purposeFilter === tab.id
                  ? 'bg-clay text-white font-semibold shadow-2xs'
                  : 'bg-[#FAF7F0] text-ink-soft hover:bg-[#F3EFE6]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ASSET GRID */}
      {filteredMedia.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E8E2D9] p-12 text-center text-xs text-ink-muted">
          <FileImage className="w-8 h-8 mx-auto text-ink-muted/40 mb-2" />
          <p className="font-medium text-ink">No photos found matching your filter.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredMedia.map((asset) => {
            const url = publicMediaUrl(asset, 400);
            const refs = referenceCounts.get(asset.id) || 0;
            const isCopied = copiedId === asset.id;

            return (
              <div
                key={asset.id}
                className="group bg-white rounded-2xl border border-[#E8E2D9] hover:border-clay/60 overflow-hidden shadow-2xs transition flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-square bg-[#FAF7F0] overflow-hidden">
                    {url ? (
                      <img
                        src={url}
                        alt={asset.original_filename || 'Media asset'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ink-muted">
                        <FileImage className="w-8 h-8 opacity-40" />
                      </div>
                    )}

                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-md text-[10px] font-semibold text-ink shadow-xs uppercase">
                        {asset.purpose}
                      </span>
                    </div>

                    {refs > 0 && (
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-emerald-600/90 text-white text-[10px] font-bold shadow-xs">
                        Used in {refs} place{refs === 1 ? '' : 's'}
                      </div>
                    )}
                  </div>

                  <div className="p-3 space-y-1">
                    <p className="text-xs font-semibold text-ink truncate" title={asset.original_filename}>
                      {asset.original_filename || 'photo.jpg'}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-ink-muted">
                      <span>{asset.width && asset.height ? `${asset.width}×${asset.height}` : 'ImageKit'}</span>
                      <span className="uppercase">{asset.format || 'jpg'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 border-t border-[#E8E2D9] bg-[#FAF7F0] flex items-center justify-between">
                  <button
                    onClick={() => copyUrl(asset)}
                    className="text-[11px] font-semibold text-clay hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{isCopied ? 'Copied!' : 'Copy URL'}</span>
                  </button>

                  <button
                    onClick={() => handleDelete(asset)}
                    className="p-1 rounded text-ink-muted hover:text-rose-600 transition"
                    title="Delete photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
