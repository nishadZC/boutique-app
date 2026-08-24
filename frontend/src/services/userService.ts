import apiClient from './api';
import { User } from '../types';

export interface UpdateProfileData {
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
}

export const userService = {
  updateProfile: async (data: UpdateProfileData): Promise<User> => {
    const response = await apiClient.put('/users/profile', data);
    return response.data;
  },
};