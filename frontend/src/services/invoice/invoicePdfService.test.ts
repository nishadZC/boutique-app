import { describe, it, expect, vi, beforeEach } from 'vitest';

// A fake jsPDF that records what is drawn; the real one needs a canvas and saves files.
const pdf = vi.hoisted(() => {
  const state = { pages: 1, texts: [] as string[] };
  const chain = () => vi.fn(function (this: unknown) { return this; });
  const api: Record<string, unknown> = {
    state,
    addPage: vi.fn(function (this: unknown) { state.pages += 1; return this; }),
    getNumberOfPages: vi.fn(() => state.pages),
    text: vi.fn(function (this: unknown, t: string | string[]) { state.texts.push(...([] as string[]).concat(t)); return this; }),
    splitTextToSize: vi.fn((t: string) => [t]),
    save: vi.fn(),
  };
  for (const m of ['line', 'rect', 'setDrawColor', 'setFillColor', 'setFont', 'setFontSize', 'setLineWidth', 'setPage', 'setTextColor']) api[m] = chain();
  return api as Record<string, ReturnType<typeof vi.fn>> & { state: typeof state };
});
vi.mock('jspdf', () => ({ jsPDF: vi.fn(function () { return pdf; }) }));

import { downloadInvoicePdf, invoiceNumber } from './invoicePdfService';

const item = (n: number) => ({ id: `i${n}`, productId: `p${n}`, product: { name: `Shirt ${n}` }, price: '1000', quantity: 2, size: n % 2 ? 'M' : undefined });

const order = (overrides: Record<string, unknown> = {}) => ({
  id: 'abcdef123456',
  paymentStatus: 'paid',
  status: 'confirmed',
  createdAt: '2026-01-15T10:00:00Z',
  items: [item(1), item(2)],
  totalAmount: 2360,
  taxAmount: 360,
  shippingAddress: { street: '1 MG Road', city: 'Pune', state: 'MH', zipCode: '411001', country: 'India' },
  ...overrides,
}) as never;

const { save, addPage } = pdf;
const printed = () => pdf.state.texts.join('\n');

beforeEach(() => {
  vi.clearAllMocks();
  pdf.state.pages = 1;
  pdf.state.texts.length = 0;
});

describe('invoiceNumber', () => {
  it('is LA- plus the first 8 characters of the order id, upper-cased', () => {
    expect(invoiceNumber('abcdef123456')).toBe('LA-ABCDEF12');
  });
});

describe('downloadInvoicePdf', () => {
  it('throws for unpaid orders without building a PDF', async () => {
    await expect(downloadInvoicePdf(order({ paymentStatus: 'pending' }))).rejects.toThrow('invoice is available once');
    expect(save).not.toHaveBeenCalled();
  });

  it('builds the invoice with the customer details and saves it', async () => {
    await downloadInvoicePdf(order(), { firstName: 'A', lastName: 'B', email: ' e@x ', phone: ' 9 ' } as never);
    expect(save).toHaveBeenCalledWith('lux-atelier-invoice-LA-ABCDEF12.pdf');
    const out = printed();
    expect(out).toContain('A B');
    expect(out).toContain('e@x');
    expect(out).toContain('Shirt 1');
    expect(out).toContain('1 MG Road, Pune, MH, 411001, India');
  });

  it('falls back to "Customer" and the profile address (refunded order)', async () => {
    await downloadInvoicePdf(order({ paymentStatus: 'refunded', shippingAddress: undefined }), null);
    expect(printed()).toContain('Customer');
    expect(printed()).toContain('Not provided');
    pdf.state.texts.length = 0;
    await downloadInvoicePdf(order({ shippingAddress: '' }), { firstName: '', lastName: '', address: ' 5 Park St ' } as never);
    expect(printed()).toContain('Customer');
    expect(printed()).toContain('5 Park St');
    expect(save).toHaveBeenCalledTimes(2);
  });

  it('adds pages when there are many items', async () => {
    await downloadInvoicePdf(order({ items: Array.from({ length: 30 }, (_, i) => item(i)) }));
    expect(addPage).toHaveBeenCalled();
    expect(save).toHaveBeenCalled();
  });
});
