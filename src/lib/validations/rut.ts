export function validateRut(rut: string): boolean {
  const cleaned = rut.replace(/\./g, "").replace(/-/g, "").toUpperCase();
  if (cleaned.length < 2) return false;

  const body = cleaned.slice(0, -1);
  const dv   = cleaned.slice(-1);

  if (!/^\d+$/.test(body)) return false;

  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = sum % 11;
  const expected  = remainder === 0 ? "0" : remainder === 1 ? "K" : String(11 - remainder);

  return dv === expected;
}

export function formatRut(value: string): string {
  const cleaned = value.replace(/\./g, "").replace(/-/g, "").replace(/[^0-9Kk]/g, "").toUpperCase();
  if (cleaned.length <= 1) return cleaned;

  const body          = cleaned.slice(0, -1);
  const dv            = cleaned.slice(-1);
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `${formattedBody}-${dv}`;
}
