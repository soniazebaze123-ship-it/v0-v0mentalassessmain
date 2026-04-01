import { NextResponse } from "next/server";
import { multimodalSchema } from "@/lib/multimodal/validation";
import { generateMultimodalResult } from "@/lib/multimodal/fusion-engine";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = multimodalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const result = generateMultimodalResult(parsed.data);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}