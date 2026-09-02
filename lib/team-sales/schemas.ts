import { z } from "zod";

export const teamSalesSellerSchema = z.object({
  sellerId: z.string().uuid().nullable(),
  name: z.string().trim().min(1, "Il nome del venditore e' obbligatorio."),
  target: z.coerce.number().min(0, "Il target non puo' essere negativo.")
});

export const teamSalesPendingSchema = z.object({
  client: z.string().trim().min(1, "Il nome cliente e' obbligatorio."),
  sellerName: z.string().trim().min(1, "Il venditore e' obbligatorio."),
  value: z.coerce.number().min(0),
  phase: z.string().trim().min(1, "La fase e' obbligatoria."),
  closeDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  notes: z.string().trim().default("")
});

export const teamSalesSetupSchema = z.object({
  monthLabel: z.string().trim().min(1, "Il mese e' obbligatorio."),
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  targetTotal: z.coerce.number().min(0),
  workingDays: z.coerce.number().int().min(1).max(31),
  sellers: z.array(teamSalesSellerSchema)
});

export const teamSalesSavePayloadSchema = z.object({
  teamMonthId: z.string().uuid().nullable(),
  setup: teamSalesSetupSchema,
  pending: z.array(teamSalesPendingSchema)
});

export const createTeamSalesTeamSchema = z.object({
  name: z.string().trim().min(1, "Il nome della squadra e' obbligatorio.")
});

export type TeamSalesSavePayload = z.infer<typeof teamSalesSavePayloadSchema>;
