try {
  const total = BigInt(10);
  const limit = 15;
  const result = total / limit;
  console.log(result);
} catch (e) {
  console.error('Error:', e.message);
}
