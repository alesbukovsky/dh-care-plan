import { z } from "zod";

// Placeholder: nested data shape TBD, previous prototype fields discarded.
export const DataSchema = z.object({});

export type DataSchema = z.infer<typeof DataSchema>;
