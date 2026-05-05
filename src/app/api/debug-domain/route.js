import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getCurrentTenant } from "@/lib/tenant";

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const headersList = await headers();
  const allHeaders = {};
  headersList.forEach((value, key) => {
    allHeaders[key] = value;
  });

  let tenant = null;
  let tenantError = null;
  try {
    tenant = await getCurrentTenant();
  } catch (e) {
    tenantError = e.message;
  }

  return NextResponse.json({
    hostname: headersList.get("host"),
    xTenantSlug: headersList.get("x-tenant-slug"),
    xCustomDomain: headersList.get("x-custom-domain"),
    xNextPathname: headersList.get("x-next-pathname"),
    tenant: tenant ? {
      id: tenant.id,
      slug: tenant.slug,
      businessName: tenant.businessName,
      businessType: tenant.businessType,
      customDomain: tenant.customDomain,
      isActive: tenant.isActive,
    } : null,
    tenantError,
    requestUrl: req.url,
  }, {
    headers: {
      'Cache-Control': 'no-store',
    }
  });
}
