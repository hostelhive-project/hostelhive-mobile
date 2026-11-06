import type { InvoiceReceipt } from '../types/billing';

const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const money = (amount: number) => `PKR ${Number(amount || 0).toLocaleString()}`;
const date = (value: string | null) => value && !Number.isNaN(Date.parse(value))
  ? new Date(value).toLocaleString() : 'Not recorded';

export const buildInvoiceReceiptText = (receipt: InvoiceReceipt) => [
  'HostelHive payment receipt',
  `Receipt: ${receipt.receiptNumber}`,
  `Invoice: ${receipt.invoiceId}`,
  `Billing cycle: ${receipt.billingMonth}`,
  `Resident: ${receipt.resident?.name || 'Resident'}`,
  `Hostel: ${receipt.hostel?.name || 'Hostel'}`,
  `Room: ${receipt.roomNumber || 'Not recorded'}`,
  `Rent amount: ${money(receipt.rentAmount)}`,
  `Total paid: ${money(receipt.totalPaid)}`,
  `Payment method: ${receipt.paymentMethod}`,
  `Paid at: ${date(receipt.paidAt)}`,
  'Payment status: Paid',
].join('\n');

export const buildInvoiceReceiptHtml = (receipt: InvoiceReceipt) => {
  const rows = [
    ['Receipt number', receipt.receiptNumber],
    ['Invoice', receipt.invoiceId],
    ['Billing cycle', receipt.billingMonth],
    ['Resident', receipt.resident?.name || 'Resident'],
    ['Resident email', receipt.resident?.email || 'Not recorded'],
    ['Hostel', receipt.hostel?.name || 'Hostel'],
    ['Location', receipt.hostel?.location || 'Not recorded'],
    ['Room', receipt.roomNumber || 'Not recorded'],
    ['Rent amount', money(receipt.rentAmount)],
    ['Total paid', money(receipt.totalPaid)],
    ['Payment method', receipt.paymentMethod],
    ['Paid at', date(receipt.paidAt)],
    ['Status', 'Paid'],
  ];
  const tableRows = rows.map(([label, value]) =>
    `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`
  ).join('');

  const transactions = receipt.transactions.length
    ? `<h2>Transactions</h2><table><thead><tr><th>Method</th><th>Amount</th><th>Paid at</th><th>Reference</th></tr></thead><tbody>${receipt.transactions.map((transaction) =>
      `<tr><td>${escapeHtml(transaction.method)}</td><td>${escapeHtml(money(transaction.amount))}</td><td>${escapeHtml(date(transaction.paidAt))}</td><td>${escapeHtml(transaction.reference || '—')}</td></tr>`
    ).join('')}</tbody></table>`
    : '';

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(receipt.receiptNumber)}</title><style>
    *{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#0b1329;margin:0;padding:32px;background:#fff}.receipt{max-width:720px;margin:0 auto}.brand{font-size:13px;font-weight:700;letter-spacing:.12em;color:#64748b;text-transform:uppercase}.heading{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0b1329;padding:12px 0 18px}.heading h1{font-size:26px;margin:4px 0}.paid{color:#047857;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:999px;padding:7px 12px;font-weight:700;font-size:12px}table{width:100%;border-collapse:collapse;margin-top:22px;font-size:13px}th,td{text-align:left;padding:11px 9px;border-bottom:1px solid #e2e8f0;vertical-align:top}th{width:36%;color:#64748b;font-weight:600}h2{font-size:17px;margin:30px 0 0}.foot{margin-top:28px;color:#64748b;font-size:11px}
  </style></head><body><main class="receipt"><div class="brand">HostelHive</div><div class="heading"><div><h1>Payment receipt</h1><div>${escapeHtml(receipt.receiptNumber)}</div></div><span class="paid">PAID</span></div><table><tbody>${tableRows}</tbody></table>${transactions}<p class="foot">This receipt records a payment confirmed by HostelHive.</p></main></body></html>`;
};
