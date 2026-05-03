async function test() {
  const url = 'https://api.vercel.com/v1/registrar/domains/studiom123.com/price';
  const res = await fetch(url, { headers: { "Authorization": `Bearer ${process.env.VERCEL_TOKEN}` } });
  console.log(res.status);
  console.log(await res.json());
}
test();
