export interface AddressFields {
  houseNumber: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface SavedAddress {
  id: string;
  label: string;
  fields: AddressFields;
  phone: string;
}

export const emptyAddress: AddressFields = {
  houseNumber: '',
  street: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
};

export const isAddressComplete = (address: AddressFields): boolean =>
  (Object.keys(emptyAddress) as (keyof AddressFields)[]).every(field => !!address[field]?.trim());

export const formatAddress = (address: AddressFields): string =>
  [address.houseNumber, address.street, address.city, address.state, address.postalCode, address.country]
    .filter(Boolean)
    .join(', ');

export const addressFromString = (value?: string): AddressFields => {
  if (!value) return { ...emptyAddress };
  const parts = value.split(',').map(part => part.trim());
  return {
    houseNumber: parts[0] || '',
    street: parts[1] || '',
    city: parts[2] || '',
    state: parts[3] || '',
    postalCode: parts[4] || '',
    country: parts[5] || 'India',
  };
};