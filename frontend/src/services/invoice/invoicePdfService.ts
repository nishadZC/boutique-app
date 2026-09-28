import { jsPDF } from 'jspdf';
import { Address, Order, User } from '../../types';
import { hasInvoice } from '../../constants/orderStatus';
import { orderDelivery } from '../../utils/delivery';

// Brand palette (mirrors constants/colors.ts): ink, champagne gold, warm neutrals.
const INK: [number, number, number] = [14, 14, 14];
const CREAM: [number, number, number] = [242, 237, 228];
const GOLD: [number, number, number] = [200, 164, 110];
const GOLD_DARK: [number, number, number] = [138, 104, 52];
const MUTED: [number, number, number] = [110, 105, 98];
const RULE: [number, number, number] = [228, 222, 212];
const STONE: [number, number, number] = [247, 244, 239];

const PAGE_WIDTH = 210;
const LEFT = 18;
const RIGHT = 192;
const CONTENT_BOTTOM = 262;

// jsPDF measures right-aligned text without charSpace, so letter-spacing is
// only used on left-aligned labels. The built-in PDF fonts have no rupee glyph.
const formatMoney = (value: number | string): string => {
  const amount = typeof value === 'string' ? Number.parseFloat(value) : value;
  return `INR ${(Number.isFinite(amount) ? amount : 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (value: string): string => new Date(value).toLocaleDateString('en-IN', {
  day: '2-digit', month: 'long', year: 'numeric',
});

export const invoiceNumber = (orderId: string) => `LA-${orderId.slice(0, 8).toUpperCase()}`;

const getAddressText = (shippingAddress: Order['shippingAddress'] | undefined, fallback?: string): string => {
  if (typeof shippingAddress === 'string' && shippingAddress.trim()) return shippingAddress;
  if (shippingAddress && typeof shippingAddress === 'object' && 'address' in shippingAddress && shippingAddress.address) {
    return shippingAddress.address;
  }
  if (shippingAddress && typeof shippingAddress === 'object') {
    const a = shippingAddress as Address;
    const formatted = [a.street, a.city, a.state, a.zipCode, a.country].filter(Boolean).join(', ');
    if (formatted) return formatted;
  }
  return fallback?.trim() || 'Not provided';
};

const customerName = (user?: User | null) => (user ? `${user.firstName} ${user.lastName}`.trim() : '') || 'Customer';

function drawHeader(pdf: jsPDF) {
  pdf.setFillColor(...INK);
  pdf.rect(0, 0, PAGE_WIDTH, 44, 'F');
  pdf.setFont('times', 'bold');
  pdf.setFontSize(24);
  pdf.setTextColor(...CREAM);
  pdf.text('LUX ATELIER', LEFT, 22, { charSpace: 1.2 });
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(...GOLD);
  pdf.text("MEN'S BOUTIQUE", LEFT, 30, { charSpace: 2.4 });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...GOLD);
  pdf.text('INVOICE', RIGHT, 22, { align: 'right' });
  pdf.setDrawColor(...GOLD);
  pdf.setLineWidth(0.6);
  pdf.line(0, 44, PAGE_WIDTH, 44);
}

function drawTableHeader(pdf: jsPDF, top: number) {
  pdf.setFillColor(...STONE);
  pdf.rect(LEFT, top, RIGHT - LEFT, 9, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(...MUTED);
  pdf.text('ITEM', LEFT + 3, top + 6, { charSpace: 1 });
  pdf.text('QTY', 132, top + 6, { align: 'right' });
  pdf.text('UNIT PRICE', 162, top + 6, { align: 'right' });
  pdf.text('AMOUNT', RIGHT - 3, top + 6, { align: 'right' });
}

function drawFooter(pdf: jsPDF, page: number, pages: number) {
  pdf.setDrawColor(...GOLD);
  pdf.setLineWidth(0.3);
  pdf.line(LEFT, 276, RIGHT, 276);
  pdf.setFont('times', 'italic');
  pdf.setFontSize(10);
  pdf.setTextColor(...INK);
  pdf.text('Thank you for dressing with Lux Atelier.', LEFT, 283);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(...MUTED);
  pdf.text('Questions about this invoice? Reply to your order confirmation email.', LEFT, 288);
  pdf.text(`Page ${page} of ${pages}`, RIGHT, 288, { align: 'right' });
}

function detailBlock(pdf: jsPDF, x: number, y: number, title: string, rows: [string, string][]) {
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(...GOLD_DARK);
  pdf.text(title.toUpperCase(), x, y, { charSpace: 1.2 });
  let cursor = y + 7;
  pdf.setFontSize(9.5);
  for (const [label, value] of rows) {
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...MUTED);
    if (label) pdf.text(label, x, cursor);
    pdf.setTextColor(...INK);
    const lines = pdf.splitTextToSize(value, label ? 50 : 80);
    pdf.text(lines, label ? x + 30 : x, cursor);
    cursor += 6 * Math.max(1, lines.length);
  }
  return cursor;
}

/** Downloads a PDF invoice. Invoices only exist for paid (or since-refunded) orders. */
export const downloadInvoicePdf = async (order: Order, user?: User | null): Promise<void> => {
  if (!hasInvoice(order.paymentStatus)) {
    throw new Error('An invoice is available once the order has been paid');
  }

  const pdf = new jsPDF();
  const itemsTotal = order.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const subtotal = order.subtotalAmount ?? itemsTotal;
  const shipping = order.shippingAmount ?? 0;
  const tax = order.taxAmount ?? 0;
  const delivery = orderDelivery(order, order.timeline?.find(t => t.status === 'delivered')?.at);
  drawHeader(pdf);

  const leftEnd = detailBlock(pdf, LEFT, 58, 'Invoice', [
    ['Number', invoiceNumber(order.id)],
    ['Issued', formatDate(order.paidAt || order.createdAt)],
    ['Order date', formatDate(order.createdAt)],
    ['Payment', order.paymentStatus === 'refunded' ? 'Paid, since refunded' : 'Paid in full'],
    ...(delivery ? [[delivery.label, delivery.date] as [string, string]] : []),
  ]);
  const rightEnd = detailBlock(pdf, 112, 58, 'Billed to', [
    ['', customerName(user)],
    ['', user?.email?.trim() || ''],
    ['', user?.phone?.trim() || ''],
  ].filter(([, v]) => v) as [string, string][]);

  let y = Math.max(leftEnd, rightEnd) + 4;
  pdf.setDrawColor(...RULE);
  pdf.setLineWidth(0.3);
  pdf.line(LEFT, y, RIGHT, y);
  y = detailBlock(pdf, LEFT, y + 10, 'Ship to', [['', getAddressText(order.shippingAddress, user?.address)]]) + 4;

  drawTableHeader(pdf, y);
  y += 17;
  pdf.setFontSize(9.5);
  for (const item of order.items) {
    const name = pdf.splitTextToSize(item.product?.name || 'Product', 100);
    const rowHeight = Math.max(11, name.length * 4.5 + (item.size ? 5 : 0) + 4);
    if (y + rowHeight > CONTENT_BOTTOM) {
      pdf.addPage();
      drawHeader(pdf);
      drawTableHeader(pdf, 56);
      y = 73;
      pdf.setFontSize(9.5);
    }
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...INK);
    pdf.text(name, LEFT + 3, y);
    if (item.size) {
      pdf.setFontSize(8);
      pdf.setTextColor(...MUTED);
      pdf.text(`Size ${item.size}`, LEFT + 3, y + name.length * 4.5);
      pdf.setFontSize(9.5);
    }
    pdf.setTextColor(...MUTED);
    pdf.text(String(item.quantity), 132, y, { align: 'right' });
    pdf.text(formatMoney(item.price), 162, y, { align: 'right' });
    pdf.setTextColor(...INK);
    pdf.text(formatMoney(Number(item.price) * item.quantity), RIGHT - 3, y, { align: 'right' });
    y += rowHeight;
    pdf.setDrawColor(...RULE);
    pdf.line(LEFT, y - 6, RIGHT, y - 6);
  }

  if (y + 26 > CONTENT_BOTTOM) {
    pdf.addPage();
    drawHeader(pdf);
    y = 64;
  }
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.setTextColor(...MUTED);
  pdf.text('Subtotal', 150, y, { align: 'right' });
  pdf.setTextColor(...INK);
  pdf.text(formatMoney(subtotal), RIGHT - 3, y, { align: 'right' });
  y += 6;
  pdf.setTextColor(...MUTED);
  pdf.text('Shipping', 150, y, { align: 'right' });
  pdf.setTextColor(...INK);
  pdf.text(shipping > 0 ? formatMoney(shipping) : 'Complimentary', RIGHT - 3, y, { align: 'right' });
  if (tax > 0) {
    y += 6;
    pdf.setTextColor(...MUTED);
    pdf.text('Tax', 150, y, { align: 'right' });
    pdf.setTextColor(...INK);
    pdf.text(formatMoney(tax), RIGHT - 3, y, { align: 'right' });
  }
  y += 5;
  pdf.setFillColor(...INK);
  pdf.rect(118, y, RIGHT - 118, 11, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10.5);
  pdf.setTextColor(...CREAM);
  pdf.text('TOTAL PAID', 123, y + 7.3, { charSpace: 1 });
  pdf.setTextColor(...GOLD);
  pdf.text(formatMoney(order.totalAmount), RIGHT - 3, y + 7.3, { align: 'right' });

  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    pdf.setPage(page);
    drawFooter(pdf, page, pages);
  }
  pdf.save(`lux-atelier-invoice-${invoiceNumber(order.id)}.pdf`);
};
