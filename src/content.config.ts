import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const guide = defineCollection({
  loader: glob({ base: "./src/content/guide", pattern: "**/*.{md,mdx}" }),
});

export const collections = { guide };
