import { useEffect, useState } from 'react';
import { publicMediaUrl, supabase } from './supabase';
import { editorialImages, isDemoPreviewHost } from '../demoData';

export interface CmsSection {
  section_key: string;
  section_type: string;
  heading: string;
  body: string;
  cta_label: string | null;
  cta_href: string | null;
  desktopImage: string;
  mobileImage: string;
  content: Record<string, unknown>;
}

function getDemoSection(sectionKey: string): CmsSection | null {
  const sections: Record<string, CmsSection> = {
    'featured-campaign': { section_key: sectionKey, section_type: 'campaign_banner', heading: 'The Everyday Edit', body: 'Comfortable little layers for playground discoveries, snack breaks and slow Sunday mornings.', cta_label: 'Explore sample styles', cta_href: '/shop', desktopImage: editorialImages[2], mobileImage: editorialImages[4], content: { demo: true } },
    'brand-story': { section_key: sectionKey, section_type: 'brand_story', heading: 'Made for little moments.', body: 'A sample story for the Little Loom preview: soft textures, considered color and room to move through every small adventure.', cta_label: 'Shop sample looks', cta_href: '/shop', desktopImage: editorialImages[1], mobileImage: editorialImages[5], content: { demo: true, eyebrow: 'A DEMO BRAND STORY' } },
  };
  return sections[sectionKey] || null;
}

export function useCmsSection(sectionKey: string): CmsSection | null {
  const [section, setSection] = useState<CmsSection | null>(null);
  useEffect(() => {
    if (!supabase) {
      if (isDemoPreviewHost()) setSection(getDemoSection(sectionKey));
      return;
    }
    let active = true;
    void supabase.from('homepage_sections').select('section_key,section_type,heading,body,cta_label,cta_href,content,desktop:media_assets!homepage_sections_desktop_asset_id_fkey(provider,delivery_url,external_url,resource_type),mobile:media_assets!homepage_sections_mobile_asset_id_fkey(provider,delivery_url,external_url,resource_type)')
      .eq('section_key', sectionKey).eq('is_published', true).maybeSingle().then(({ data }) => {
        if (!active) return;
        if (!data) {
          if (isDemoPreviewHost()) setSection(getDemoSection(sectionKey));
          return;
        }
        const desktop = Array.isArray(data.desktop) ? data.desktop[0] : data.desktop;
        const mobile = Array.isArray(data.mobile) ? data.mobile[0] : data.mobile;
        setSection({
          section_key: data.section_key,
          section_type: data.section_type,
          heading: data.heading || '',
          body: data.body || '',
          cta_label: data.cta_label,
          cta_href: data.cta_href,
          desktopImage: desktop ? publicMediaUrl(desktop as any, 1400) : '',
          mobileImage: mobile ? publicMediaUrl(mobile as any, 800) : '',
          content: (data.content || {}) as Record<string, unknown>,
        });
      });
    return () => { active = false; };
  }, [sectionKey]);
  return section;
}
