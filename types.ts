
export interface Chapter {
  title: string;
  content: string;
}

export interface Bonus {
  type: 'Checklist' | 'Mini-Guide' | 'Template' | 'Cheat Sheet' | 'Worksheet';
  title: string;
  description: string;
  items?: string[];
}

export interface EbookData {
  title: string;
  subtitle: string;
  introduction: string;
  chapters: Chapter[];
  bonuses: Bonus[];
  author: string;
  niche: string;
}

export type CoverTemplateId = 'modern' | 'bold' | 'minimal' | 'gradient' | 'elegant' | 'dark';

export interface EbookState {
  isGenerating: boolean;
  data: EbookData | null;
  selectedCoverId: CoverTemplateId;
}
