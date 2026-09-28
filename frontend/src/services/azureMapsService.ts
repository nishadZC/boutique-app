import apiClient from './api';
import { AddressFields } from '../types/address';

export const reverseGeocode = async (latitude: number, longitude: number): Promise<AddressFields> => {
  const response = await apiClient.get('/users/location/reverse', { params: { latitude, longitude } });
  return response.data.data;
};

export const getCurrentAddress = (): Promise<AddressFields> => new Promise((resolve, reject) => {
  if (!navigator.geolocation) {
    reject(new Error('Location is not supported by this browser'));
    return;
  }
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => reverseGeocode(coords.latitude, coords.longitude).then(resolve).catch(reject),
    (error) => {
      if (!window.isSecureContext) {
        console.warn('Geolocation requires HTTPS. Falling back to IP-based location.');
        fetch('https://get.geojs.io/v1/ip/geo.json')
          .then((res) => res.json())
          .then((data) => {
            if (data.latitude && data.longitude) {
              reverseGeocode(Number.parseFloat(data.latitude), Number.parseFloat(data.longitude)).then(resolve).catch(reject);
            } else {
              reject(new Error('IP fallback location failed.'));
            }
          })
          .catch(() => reject(new Error('Location requires HTTPS on non-localhost domains, and fallback failed.')));
      } else {
        reject(new Error('Location permission was denied by the user.'));
      }
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
  );
});