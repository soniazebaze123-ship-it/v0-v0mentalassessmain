import { z } from "zod";

export const multimodalSchema = z.object({
  userId: z.string().min(1),
  eeg: z.object({
    thetaAlphaRatio: z.number().nullable(),
    alphaPower: z.number().nullable(),
    betaPower: z.number().nullable(),
    thetaPower: z.number().nullable(),
    deltaPower: z.number().nullable(),
    connectivityFlag: z.boolean(),
    p300Latency: z.number().nullable(),
    p300Amplitude: z.number().nullable(),
    n200Latency: z.number().nullable(),
    mmnLatency: z.number().nullable(),
  }),
  sensory: z.object({
    olfactoryScore: z.number().nullable(),
    hearingFlag: z.boolean(),
    visualFlag: z.boolean(),
    auditoryErpLatency: z.number().nullable(),
    visualErpLatency: z.number().nullable(),
    olfactoryErpLatency: z.number().nullable(),
  }),
  blood: z.object({
    abeta42: z.number().nullable(),
    abeta40: z.number().nullable(),
    pTau181: z.number().nullable(),
    totalTau: z.number().nullable(),
    nfl: z.number().nullable(),
    crp: z.number().nullable(),
    il6: z.number().nullable(),
    tnfAlpha: z.number().nullable(),
  }),
  notes: z.string().optional(),
});