const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3004';

export async function createProfile(userId: string, profile: { email: string; firstName: string; lastName: string }): Promise<void> {
  try {
    const response = await fetch(`${USER_SERVICE_URL}/internal/users/${userId}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-internal-token': process.env.INTERNAL_API_TOKEN || '' },
      body: JSON.stringify(profile),
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) console.error(`Profile for ${userId} not created: user service returned ${response.status}`);
  } catch (error) {
    console.error(`Profile for ${userId} not created:`, (error as Error).message);
  }
}
