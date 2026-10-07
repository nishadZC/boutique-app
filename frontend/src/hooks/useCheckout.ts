import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { orderService } from '../services/orderService';
import { paymentService } from '../services/paymentService';
import { calculateCartTotals } from '../utils/cartPricing';
import { getPhoneError, normalizePhone } from '../utils/validation';

interface CheckoutOptions {
  address: string;
  addressComplete: boolean;
  phone: string;
  setAddressError: (message: string) => void;
  onAddressSaved: () => void;
  checkoutItems: any[];
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export const useCheckout = ({ address, addressComplete, phone, setAddressError, onAddressSaved, checkoutItems }: CheckoutOptions) => {
  const { removeItems } = useCart();
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { total: finalTotal } = calculateCartTotals(checkoutItems);

  const handleCheckout = async (): Promise<void> => {
    if (!addressComplete) {
      setAddressError('Please fill in all address fields before proceeding to checkout.');
      showToast('Please complete all address fields before checkout.', 'warning');
      return;
    }
    const phoneError = getPhoneError(phone);
    if (phoneError) {
      showToast(phoneError, 'warning');
      return;
    }
    const normalizedPhone = normalizePhone(phone)!;
    if (!user || !user.firstName || !user.lastName || !address.trim()) {
      showToast('Please complete your profile before checkout.', 'warning');
      navigate('/profile');
      return;
    }

    setAddressError('');
    setIsCheckingOut(true);
    let createdOrderId: string | undefined;

    try {
      if (user.address !== address || user.phone !== normalizedPhone) {
        await updateProfile({
          firstName: user.firstName,
          lastName: user.lastName,
          phone: normalizedPhone,
          address,
        }).catch((error) => console.error('Failed to update profile address during checkout:', error));
      }

      const order = await orderService.createOrder({
        items: checkoutItems.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          selectedSize: item.selectedSize,
        })),
        shippingAddress: { address },
      });
      createdOrderId = order.id;
      const paymentOrder = await paymentService.createPaymentOrder(order.id);

      await new Promise<void>((resolve, reject) => {
        paymentService.openCheckout({
          key: paymentOrder.keyId,
          amount: paymentOrder.amount,
          currency: paymentOrder.currency,
          name: 'Boutique',
          description: `Payment for order ${order.id}`,
          order_id: paymentOrder.id,
          prefill: { name: `${user.firstName} ${user.lastName}`, email: user.email, contact: normalizedPhone },
          handler: async (response: RazorpayResponse) => {
            try {
              await paymentService.verifyPayment({
                orderId: order.id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              resolve();
            } catch (error) {
              reject(error);
            }
          },
          modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
        }).catch(reject); // e.g. the Razorpay script failed to load
      });

      showToast('Payment successful. Your order is confirmed.', 'success');
      onAddressSaved();
      removeItems(checkoutItems.map(item => ({ id: item.id, selectedSize: item.selectedSize })));
      navigate('/orders');
    } catch (error) {
      console.error('Failed to create order:', error);
      if (createdOrderId) await paymentService.markPaymentFailed(createdOrderId).catch(() => undefined);
      showToast('Payment failed or was cancelled. Your order is not complete.', 'error');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return { finalTotal, isCheckingOut, handleCheckout };
};