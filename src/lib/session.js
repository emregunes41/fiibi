import { cookies } from "next/headers";
import { verifyAuth } from "./auth";

/**
 * Server Action'lar ve API route'lar için mevcut oturumu döndürür.
 */
export async function getServerAuthSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;
    
    return await verifyAuth(token);
  } catch (err) {
    return null;
  }
}

/**
 * Sadece ADMIN yetkisi olanların işlem yapabilmesi için kontrolcü.
 */
export async function requireAdmin() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) {
      return { error: "Yetkisiz erişim. Bu işlem yalnızca yöneticiler tarafından yapılabilir.", statusCode: 401 };
    }
    const session = await verifyAuth(token);
    if (!session || !session.adminId) {
       return { error: "Yetkisiz erişim düzenlemesi. Bu işlem yalnızca yöneticiler tarafından yapılabilir.", statusCode: 401 };
    }
    return { success: true, session };
  } catch(err) {
    return { error: "Geçersiz yetki.", statusCode: 401 };
  }
}

/**
 * Giriş yapmış herhangi bir kullanıcının (MEMBER veya ADMIN) işlem yapabilmesi için kontrolcü.
 */
export async function requireUser() {
  const session = await getServerAuthSession();
  if (!session) {
    return { error: "Bu işlemi gerçekleştirmek için giriş yapmalısınız.", statusCode: 401 };
  }
  return { success: true, session };
}
