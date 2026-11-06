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

const billingMonth = (value: string) => {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, 1)
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : value;
};

export const buildInvoiceReceiptText = (receipt: InvoiceReceipt) => [
  'HostelHive payment receipt',
  `Receipt: ${receipt.receiptNumber}`,
  `Invoice: ${receipt.invoiceId}`,
  `Billing cycle: ${billingMonth(receipt.billingMonth)}`,
  `Resident: ${receipt.resident?.name || 'Resident'}`,
  `Hostel: ${receipt.hostel?.name || 'Hostel'}`,
  `Room: ${receipt.roomNumber || 'Not recorded'}`,
  `Rent amount: ${money(receipt.rentAmount)}`,
  `Total paid: ${money(receipt.totalPaid)}`,
  ...(receipt.refundedAmount ? [`Refunds recorded: ${money(receipt.refundedAmount)}`] : []),
  `Payment method: ${receipt.paymentMethod}`,
  `Paid at: ${date(receipt.paidAt)}`,
  'Payment status: Paid',
].join('\n');

export const buildInvoiceReceiptHtml = (receipt: InvoiceReceipt) => {
  const rows = [
    ['Invoice', receipt.invoiceId],
    ['Billing cycle', billingMonth(receipt.billingMonth)],
    ['Room', receipt.roomNumber || 'Not recorded'],
    ['Payment method', receipt.paymentMethod],
    ['Paid at', date(receipt.paidAt)],
  ];
  const tableRows = rows.map(([label, value]) =>
    `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`
  ).join('');

  const transactions = receipt.transactions.length
    ? `<h2>Payment transactions</h2><table class="transactions"><thead><tr><th>Method</th><th>Amount</th><th>Paid at</th><th>Reference</th></tr></thead><tbody>${receipt.transactions.map((transaction) =>
      `<tr><td>${escapeHtml(transaction.method)}</td><td>${escapeHtml(money(transaction.amount))}</td><td>${escapeHtml(date(transaction.paidAt))}</td><td>${escapeHtml(transaction.reference || '—')}</td></tr>`
    ).join('')}</tbody></table>`
    : '';

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(receipt.receiptNumber)} - HostelHive receipt</title><style>
    @page{size:A4;margin:14mm}*{box-sizing:border-box}body{font-family:Inter,Arial,sans-serif;color:#152238;margin:0;padding:28px;background:#fff;font-size:13px;line-height:1.5}.receipt{max-width:760px;margin:0 auto}.brand{font-size:19px;font-weight:700;color:#0b1220}.heading{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:2px solid #0b1220;padding:12px 0 20px}.heading h1{font-size:26px;line-height:1.2;margin:8px 0}.muted{color:#596a80}.paid{color:#047857;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:999px;padding:6px 12px;font-weight:700;font-size:12px;white-space:nowrap}.parties{display:flex;gap:28px;margin:24px 0}.party{flex:1;min-width:0;overflow-wrap:anywhere}.eyebrow{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#708097;margin:0 0 5px}.party strong{display:block;font-size:14px;margin-bottom:3px}.party p{margin:2px 0}.summary{border:1px solid #dce3eb;border-radius:12px;padding:16px 20px;background:#f5f7fa;display:flex;justify-content:space-between;gap:16px;align-items:center}.summary strong{font-size:25px;color:#0b1220}.summary p{margin:0}.summary small{color:#596a80}table{width:100%;border-collapse:collapse;margin-top:16px;font-size:12px;table-layout:fixed}th,td{text-align:left;padding:10px 8px;border-bottom:1px solid #e8edf2;vertical-align:top;overflow-wrap:anywhere}.details th{width:30%;color:#596a80;font-weight:500}.transactions thead{display:table-header-group;background:#f5f7fa}.transactions th{font-weight:600}.transactions th:nth-child(2){width:20%}tr{break-inside:avoid}h2{font-size:15px;margin:26px 0 0}.foot{margin-top:24px;padding-top:14px;border-top:1px solid #e8edf2;color:#708097;font-size:11px}.refund{font-size:12px;color:#596a80;margin-top:12px}.preview-actions{max-width:760px;margin:0 auto 24px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding-bottom:16px;border-bottom:1px solid #e8edf2}.preview-actions button{border:0;border-radius:8px;background:#0b1220;color:#fff;font:inherit;font-weight:600;padding:11px 16px;cursor:pointer}.preview-actions p{margin:0;color:#596a80;font-size:12px}@media(max-width:520px){body{padding:18px}.parties{flex-direction:column;gap:16px}.summary{padding:14px}.summary strong{font-size:21px}.transactions{font-size:10px}.transactions th,.transactions td{padding:8px 4px}}@media print{body{padding:0}.preview-actions{display:none!important}.heading,.parties,.summary,.foot{break-inside:avoid}.summary,.paid,.transactions thead{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body><main class="receipt"><div class="brand">HostelHive</div><div class="heading"><div><h1>Payment receipt</h1><div class="muted">${escapeHtml(receipt.receiptNumber)} &middot; ${escapeHtml(billingMonth(receipt.billingMonth))}</div></div><span class="paid">PAID</span></div><div class="parties"><div class="party"><p class="eyebrow">Paid by</p><strong>${escapeHtml(receipt.resident?.name || 'Resident')}</strong><p class="muted">${escapeHtml(receipt.resident?.email || 'Email not recorded')}</p>${receipt.resident?.residentCode ? `<p class="muted">${escapeHtml(receipt.resident.residentCode)}</p>` : ''}</div><div class="party"><p class="eyebrow">Hostel</p><strong>${escapeHtml(receipt.hostel?.name || 'Hostel')}</strong><p class="muted">${escapeHtml(receipt.hostel?.location || 'Location not recorded')}</p></div></div><div class="summary"><div><p class="eyebrow">${receipt.refundedAmount ? 'Net amount paid' : 'Total paid'}</p><small>Base rent: ${escapeHtml(money(receipt.rentAmount))}</small></div><strong>${escapeHtml(money(receipt.totalPaid))}</strong></div>${receipt.refundedAmount ? `<p class="refund">Refunds recorded: ${escapeHtml(money(receipt.refundedAmount))}. The total above reflects the remaining paid amount.</p>` : ''}<table class="details"><tbody>${tableRows}</tbody></table>${transactions}<p class="foot">This receipt records a payment confirmed by HostelHive. Keep it for your records.</p></main></body></html>`;
};

/** Browser-only receipt document; Expo Print on web would print the application UI. */
export const openBrowserReceiptPreview = () => {
  const preview = window.open('', '_blank');
  if (!preview) throw new Error('Allow pop-ups for HostelHive to open the receipt PDF preview, then try again.');
  preview.opener = null;
  preview.document.title = 'Preparing HostelHive receipt';
  preview.document.body.textContent = 'Preparing your receipt…';
  return {
    close: () => { if (!preview.closed) preview.close(); },
    show: (html: string) => {
      if (preview.closed) return;
      preview.document.open();
      preview.document.write(html);
      preview.document.close();
      const toolbar = preview.document.createElement('div');
      toolbar.className = 'preview-actions';
      const hint = preview.document.createElement('p');
      hint.textContent = 'Receipt preview · Choose “Save as PDF” in the print dialog.';
      const printButton = preview.document.createElement('button');
      printButton.type = 'button';
      printButton.textContent = 'Print / Save PDF';
      printButton.addEventListener('click', () => { preview.focus(); preview.print(); });
      toolbar.append(hint, printButton);
      preview.document.body.prepend(toolbar);
      // Keep a visible retry control if a browser suppresses automatic printing.
      preview.setTimeout(() => { if (!preview.closed) { preview.focus(); preview.print(); } }, 150);
    },
  };
};
