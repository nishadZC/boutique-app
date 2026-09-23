import { jsPDF } from 'jspdf';
import { Address, Order, User } from '../../types';

const GOLD = '#c59b3d';
const INK = '#1f1b18';
const MUTED = '#6b665f';
const PAGE_WIDTH = 210;
const LEFT = 18;
const RIGHT = 192;

const formatMoney = (value: number | string): string => {
  const amount = typeof value === 'string' ? parseFloat(value) : value;
  return `INR ${Number.isFinite(amount) ? amount.toFixed(2) : '0.00'}`;
};

const formatDate = (value: string): string => new Date(value).toLocaleDateString('en-IN', {
  day: '2-digit', month: 'long', year: 'numeric',
});

// jsPDF's addImage needs rasterized PNG/JPEG data, so the brand SVG is drawn
// onto an offscreen canvas at a higher resolution than its placed size for
// a crisp result, rather than pulling in the generic CRA logo192.png icon.
const loadLogo = async (): Promise<string | null> => {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}lux-atelier-logo.svg`);
    if (!response.ok) return null;
    const svgText = await response.text();
    const svgUrl = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml' }));

    return await new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        URL.revokeObjectURL(svgUrl);
        if (!ctx) { resolve(null); return; }
        ctx.drawImage(img, 0, 0, size, size);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => { URL.revokeObjectURL(svgUrl); resolve(null); };
      img.src = svgUrl;
    });
  } catch {
    return null;
  }
};

const getAddressText = (shippingAddress: Address | { address?: string } | undefined, fallback?: string): string => {
  if (shippingAddress && 'address' in shippingAddress && shippingAddress.address) return shippingAddress.address;
  if (shippingAddress) {
    const address = shippingAddress as Address;
    const formattedAddress = [address.street, address.city, address.state, address.zipCode, address.country]
      .filter(Boolean)
      .join(', ');
    if (formattedAddress) return formattedAddress;
  }
  return fallback?.trim() || 'Not provided';
};

const drawWrappedText = (pdf: jsPDF, value: string, x: number, y: number, width: number): number => {
  const lines = pdf.splitTextToSize(value, width);
  pdf.text(lines, x, y);
  return lines.length;
};

const formatStatus = (status: string): string => status.charAt(0).toUpperCase() + status.slice(1);

const getCustomerName = (user?: User | null): string => {
  const name = user ? `${user.firstName} ${user.lastName}`.trim() : '';
  return name || 'Customer';
};

const getCustomerPhone = (user?: User | null): string => user?.phone?.trim() || 'Not provided';

const getCustomerEmail = (user?: User | null): string => user?.email?.trim() || 'Not provided';

const getShippingAddress = (order: Order, user?: User | null): string => {
  return getAddressText(order.shippingAddress as Address | { address?: string }, user?.address);
};

export const downloadInvoicePdf = async (order: Order, user?: User | null): Promise<void> => {
  const pdf = new jsPDF();
  const logo = await loadLogo();
  const customerName = getCustomerName(user);
  const subtotal = order.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const paymentStatus = order.paymentStatus || 'pending';

  pdf.setFillColor(INK);
  pdf.rect(0, 0, PAGE_WIDTH, 42, 'F');
  if (logo) pdf.addImage(logo, 'PNG', LEFT, 8, 25, 25);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.text('LUX ATELIER', logo ? 50 : LEFT, 19);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(224, 185, 88);
  pdf.text('FORMAL WEAR & PERSONAL STYLE', logo ? 50 : LEFT, 27);
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(18);
  pdf.text('INVOICE', RIGHT, 18, { align: 'right' });

  pdf.setTextColor(INK);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('Invoice details', LEFT, 57);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(MUTED);
  pdf.text('Invoice number', LEFT, 66);
  pdf.text('Issue date', LEFT, 74);
  pdf.text('Payment status', LEFT, 82);
  pdf.setTextColor(INK);
  drawWrappedText(pdf, order.id, 58, 66, 46);
  pdf.text(formatDate(order.createdAt), 58, 74);
  pdf.text(formatStatus(paymentStatus), 58, 82);

  pdf.setTextColor(INK);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Customer details', 112, 57);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(customerName, 112, 66);
  pdf.setTextColor(MUTED);
  pdf.text(getCustomerEmail(user), 112, 74);
  pdf.text(getCustomerPhone(user), 112, 82);

  pdf.setDrawColor(GOLD);
  pdf.setLineWidth(0.5);
  pdf.line(LEFT, 91, RIGHT, 91);
  pdf.setTextColor(INK);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Shipping address', LEFT, 103);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(MUTED);
  drawWrappedText(pdf, getShippingAddress(order, user), LEFT, 111, 174);

  const tableTop = 125;
  pdf.setFillColor(245, 241, 233);
  pdf.rect(LEFT, tableTop, RIGHT - LEFT, 10, 'F');
  pdf.setTextColor(INK);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('ITEM', LEFT + 3, tableTop + 6);
  pdf.text('QTY', 137, tableTop + 6, { align: 'right' });
  pdf.text('PRICE', 160, tableTop + 6, { align: 'right' });
  pdf.text('AMOUNT', RIGHT - 3, tableTop + 6, { align: 'right' });

  let y = tableTop + 18;
  pdf.setFont('helvetica', 'normal');
  order.items.forEach(item => {
    const itemName = item.product?.name || 'Product';
    const itemLines = pdf.splitTextToSize(itemName, 105);
    pdf.setTextColor(INK);
    pdf.text(itemLines, LEFT + 3, y);
    pdf.setTextColor(MUTED);
    if (item.size) pdf.text(`Size: ${item.size}`, LEFT + 3, y + itemLines.length * 4 + 1);
    pdf.text(String(item.quantity), 137, y, { align: 'right' });
    pdf.text(formatMoney(item.price), 160, y, { align: 'right' });
    pdf.setTextColor(INK);
    pdf.text(formatMoney(Number(item.price) * item.quantity), RIGHT - 3, y, { align: 'right' });
    y += Math.max(12, itemLines.length * 4 + (item.size ? 6 : 0));
    pdf.setDrawColor(225, 220, 211);
    pdf.line(LEFT, y - 5, RIGHT, y - 5);
  });

  y += 5;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(MUTED);
  pdf.text('Subtotal', 145, y, { align: 'right' });
  pdf.setTextColor(INK);
  pdf.text(formatMoney(subtotal), RIGHT - 3, y, { align: 'right' });
  y += 9;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(INK);
  pdf.text('Total', 145, y, { align: 'right' });
  pdf.setTextColor(GOLD);
  pdf.text(formatMoney(order.totalAmount), RIGHT - 3, y, { align: 'right' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(MUTED);
  pdf.text('Thank you for choosing Lux Atelier.', LEFT, 275);
  pdf.text('For questions about this invoice, please contact our support team.', LEFT, 282);
  pdf.setTextColor(INK);
  pdf.setFontSize(8);
  pdf.text('Lux Atelier | Premium formal wear and personal style', PAGE_WIDTH / 2, 291, { align: 'center' });
  pdf.save(`lux-atelier-invoice-${order.id}.pdf`);
};