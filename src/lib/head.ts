export const pageHead = (title: string, description: string) => () => ({
  meta: [
    { title: `${title} — MaQi Admin` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — MaQi Admin` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ],
});
