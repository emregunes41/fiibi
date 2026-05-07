import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const DEFAULTS = {
  basic_monthly: 1499, basic_yearly: 14999,
  pro_monthly: 2999, pro_yearly: 29999,
};

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
