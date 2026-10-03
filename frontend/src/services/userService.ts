import apiClient from './api';
import { Profile } from '../types';

export interface UpdateProfileData {
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
}

const toProfile = (data: any): Profile => ({
  firstName: data.firstName ?? '',
  lastName: data.lastName ?? '',
  phone: data.phone ?? undefined,
  address: data.address ?? undefined,
});

export const userService = {
  getProfile: async (): Promise<Profile> => {
    const response = await apiClient.get('/users/profile');
    return toProfile(response.data);
  },

  updateProfile: async (data: UpdateProfileData): Promise<Profile> => {
    const response = await apiClient.put('/users/profile', data);
    return toProfile(response.data);
  },
};