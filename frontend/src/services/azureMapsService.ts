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
    () => reject(new Error('Location permission was denied')),
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
  );
});