import { isDemoPreviewHost } from '../demoData';

export default function DemoPreviewNotice() {
  if (!isDemoPreviewHost()) return null;
  return (
    <div role="status" className="bg-[#38313f] px-3 py-2 text-center text-[10px] font-medium uppercase tracking-[0.14em] text-ivory sm:text-xs">
      Demo preview · Sample products and imagery · No real inventory or purchases
    </div>
  );
}
