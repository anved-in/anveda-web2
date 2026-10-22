import raw from "@/data/faqs.json";

/** A question and answer for the Help page, written in the CMS (Help questions) and arranged there. */
export interface Faq {
  id: number;
  question: string;
  answer: string;
}

export const faqs = (): Faq[] => (raw as { faqs: Faq[] }).faqs.filter((f) => f.question && f.answer);
