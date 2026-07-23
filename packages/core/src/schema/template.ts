import { z } from "zod";

// Placeholder: flat shape TBD once the data→template conversion is designed.
export const TemplateSchema = z.object({});

export type TemplateSchema = z.infer<typeof TemplateSchema>;
