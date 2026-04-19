import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const DEFAULTS = { monthly: 2499, yearly: 24999, lifetime: 69500 };

export async function GET() {
  try {
    const config = await prisma.platformConfig.findUnique({ where: { id: "main" } });
    if (!config) return NextResponse.json(DEFAULTS);
    
    const pricing = typeof config.pricing === "string" ? JSON.parse(config.pricing) : config.pricing;
    return NextResponse.json({ ...DEFAULTS, ...pricing });
  } catch {
    return NextResponse.json(DEFAULTS);
  }
}
