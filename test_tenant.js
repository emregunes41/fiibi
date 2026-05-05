const { getTenantByDomain } = require('./src/lib/tenant.js');

async function test() {
  const tenant = await getTenantByDomain("www.pinowed.com");
  console.log("Result:", tenant);
}
test();
