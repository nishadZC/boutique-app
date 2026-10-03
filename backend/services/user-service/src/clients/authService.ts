const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3002';

export async function fetchAccountRoles(ids: string[]): Promise<{ roles: Record<string, string>; admins: number }> {
  const url = new URL('/internal/accounts/roles', AUTH_SERVICE_URL);
  url.searchParams.set('ids', ids.join(','));
  const response = await fetch(url, {
    headers: { 'x-internal-token': process.env.INTERNAL_API_TOKEN || '' },
    signal: AbortSignal.timeout(3000),
  });
  if (!response.ok) throw new Error(`Auth service returned ${response.status}`);
  return (await response.json()).data;
}
