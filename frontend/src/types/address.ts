export interface AddressFields {
  houseNumber: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export const emptyAddress: AddressFields = {
  houseNumber: '',
  street: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
};

export const formatAddress = (address: AddressFields): string =>
  [address.houseNumber, address.street, address.city, address.state, address.postalCode, address.country]
    .filter(Boolean)
    .join(', ');

export const addressFromString = (value?: string): AddressFields => ({
  ...emptyAddress,
  street: value || '',
});