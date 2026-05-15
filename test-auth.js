const { SignJWT } = require("jose");
async function main() {
  const secret = new TextEncoder().encode("super_secret_jwt_key_fiibi_123!");
  const token = await new SignJWT({
    id: "cm3tky1wz0000y8w9g7o6e2q4",
    email: "emregunesart@icloud.com",
    role: "ADMIN",
    tenantId: "fiibi",
    plan: "pro"
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);
  console.log(token);
}
main();
