import { jwtVerify, SignJWT } from "jose";

export const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // In production, we should throw an error, but for setup we fallback
    return new TextEncoder().encode("pinowed-super-secret-key-2026-fallback"); 
  }
  return new TextEncoder().encode(secret);
};

export async function verifyAuth(token) {
  try {
    const verified = await jwtVerify(token, getJwtSecretKey());
    return verified.payload;
  } catch (err) {
    throw new Error("Your token has expired or is invalid.");
  }
}

export async function signToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getJwtSecretKey());
}

