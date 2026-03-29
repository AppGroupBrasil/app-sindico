import { MagazineSection } from '../types';

const DEMO_CLASSIFIEDS_STORAGE_KEY = 'app-revista-demo-classificados';

export interface DemoClassifiedSubmission {
  id: string;
  name: string;
  unit: string;
  phone: string;
  title: string;
  description: string;
  category: string;
  price: string;
  images: string[];
  createdAt: string;
}

const categoryIconMap: Record<string, string> = {
  venda: '💰',
  troca: '🔄',
  doacao: '🎁',
  servico: '🛠',
};

export function loadDemoClassifieds(): DemoClassifiedSubmission[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(DEMO_CLASSIFIEDS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDemoClassified(submission: DemoClassifiedSubmission) {
  if (typeof window === 'undefined') return;

  const current = loadDemoClassifieds();
  const next = [submission, ...current].slice(0, 12);
  window.localStorage.setItem(DEMO_CLASSIFIEDS_STORAGE_KEY, JSON.stringify(next));
}

export function mergeClassifiedSection(
  section: MagazineSection,
  submissions: DemoClassifiedSubmission[],
): MagazineSection {
  if (submissions.length === 0) return section;

  const submittedLines = submissions.map((submission) => {
    const prefix = categoryIconMap[submission.category] || '📌';
    const pricePart = submission.price.trim() ? ` — ${submission.price.trim()}` : '';
    const suffix = ` (${submission.unit}${submission.phone.trim() ? ` · ${submission.phone.trim()}` : ''})`;
    return `${prefix} ${submission.title}${pricePart}${suffix}`;
  });

  const existingLines = section.content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const submittedImages = submissions.flatMap((submission) => submission.images);

  return {
    ...section,
    content: [...submittedLines, ...existingLines].join('\n'),
    images: [...submittedImages, ...section.images],
  };
}