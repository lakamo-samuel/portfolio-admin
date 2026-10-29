export type SkillGroup = { group: string; items: string[] };
export type SiteContent = {
  themeDefault: "light" | "dark";
  hero: { greeting: string; title: string; description: string; availability: string; image: string; imageAlt: string; cvPath: string; cvFilename: string; cvLabel: string; contactLabel: string };
  about: { title: string; paragraphs: string[]; image: string; imageAlt: string };
  skills: { title: string; intro: string; supportingText: string; noteTitle: string; learningTitle: string; learningText: string; mainImage: string; workImage: string; photoCaption: string; groups: SkillGroup[] };
  contact: { formTitle: string; heading: string; tagline: string; body: string; email: string; phone: string; whatsappUrl: string; telegramUrl: string; topics: string[] };
  links: { github: string; linkedin: string; x: string };
  footer: { copyright: string };
};
