import { Router } from 'express';
import { requireUser } from '@boutique/shared';

export const locationRoutes = Router();

// Signed-in only: this spends the Azure Maps subscription.
locationRoutes.get('/location/reverse', requireUser, async (req, res) => {
  const latitude = Number(req.query.latitude);
  const longitude = Number(req.query.longitude);
  const subscriptionKey = process.env.AZURE_MAPS_SUBSCRIPTION_KEY;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    res.status(400).json({ success: false, error: 'Valid location coordinates are required' });
    return;
  }
  if (!subscriptionKey) {
    res.status(503).json({ success: false, error: 'Location lookup is not configured' });
    return;
  }

  try {
    const url = new URL('https://atlas.microsoft.com/search/address/reverse/json');
    url.searchParams.set('api-version', '1.0');
    url.searchParams.set('query', `${latitude},${longitude}`);
    url.searchParams.set('subscription-key', subscriptionKey);
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) {
      res.status(502).json({ success: false, error: 'Unable to find your current address' });
      return;
    }
    const data = await response.json() as { addresses?: Array<{ address?: Record<string, string> }> };
    const address = data.addresses?.[0]?.address;
    if (!address) {
      res.status(404).json({ success: false, error: 'No address found for your current location' });
      return;
    }
    res.json({ success: true, data: {
      houseNumber: address.streetNumber || '',
      street: address.streetName || '',
      city: address.municipality || '',
      state: address.countrySubdivision || '',
      postalCode: address.postalCode || '',
      country: address.country || 'India',
    } });
  } catch (error) {
    console.error('Azure Maps reverse geocoding error:', error);
    res.status(502).json({ success: false, error: 'Unable to find your current address' });
  }
});
