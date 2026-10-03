// The profiles table, as the routes read and return it.

export const PROFILE_COLUMNS = 'user_id, email, first_name, last_name, phone, address, created_at, updated_at';

export const toProfile = (p: any) => ({
  id: p.user_id, email: p.email, firstName: p.first_name ?? '', lastName: p.last_name ?? '',
  phone: p.phone, address: p.address, createdAt: p.created_at, updatedAt: p.updated_at,
});
