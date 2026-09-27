import { OrderRequestStatus, OrderRequestType } from '../types';

/** Days after delivery within which a return or refund can be requested (matches the orders service). */
export const RETURN_WINDOW_DAYS = 7;

export const CANCEL_REASONS = [
  'Ordered by mistake',
  'Found a better price elsewhere',
  'Delivery date is too late',
  'Want to change size or item',
  'Changed my mind',
  'Other',
];

export const RETURN_REASONS = [
  'Wrong size or fit',
  'Damaged or defective item',
  'Received the wrong item',
  'Item does not match the description',
  'Quality not as expected',
  'Other',
];

export const REQUEST_TYPE_LABEL: Record<OrderRequestType, string> = {
  cancel: 'Cancellation',
  return: 'Return',
  refund: 'Refund',
};

export const REQUEST_STATUS_LABEL: Record<OrderRequestStatus, string> = {
  pending: 'Awaiting review',
  refunded: 'Refunded',
  rejected: 'Rejected',
  closed: 'Closed',
};
