import { z } from 'zod';

export const createFlightSchema = z.object({
  callsign: z
    .string()
    .min(1)
    .max(10)
    .regex(/^[A-Z0-9]+$/i, 'Callsign must be alphanumeric')
    .optional()
    .default('SIM001'),
  timeScale: z
    .number()
    .min(1, 'Time scale must be at least 1')
    .max(300, 'Time scale must not exceed 300')
    .optional()
    .default(60),
});

export const flightIdSchema = z.object({
  id: z.string().uuid('Invalid flight ID format'),
});

export type CreateFlightInput = z.infer<typeof createFlightSchema>;
