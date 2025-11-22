const formatCurrency = (value) =>
  Number(value).toLocaleString("vi-VN") + " ₫";

const buildInvoiceHtml = (data) => `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>Invoice - ${data.salesOrderCode}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 32px; color: #333; }
    h1 { margin-bottom: 8px; }
    .meta { margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f5f5f5; }
    .total { text-align: right; font-size: 18px; margin-top: 16px; }
  </style>
</head>
<body>
  <h1>HÓA ĐƠN THANH TOÁN</h1>
  <div class="meta">
    <p><strong>Mã đơn hàng:</strong> ${data.salesOrderCode}</p>
    <p><strong>Phiếu xuất kho:</strong> ${data.goodsIssueNoteId}</p>
    <p><strong>Loại thanh toán:</strong> ${data.paymentTypeText}</p>
    <p><strong>Phương thức:</strong> ${data.paymentMethodText}</p>
  </div>
  <table>
    <thead>
      <tr>
        <th>STT</th>
        <th>Nội dung</th>
        <th>Số tiền</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td>${data.description}</td>
        <td>${formatCurrency(data.amount)}</td>
      </tr>
    </tbody>
  </table>
  <p class="total"><strong>Tổng cộng: ${formatCurrency(data.amount)}</strong></p>
  <p><em>Đây là hóa đơn demo phục vụ test giao diện.</em></p>
</body>
</html>
`;

export const openInvoicePdfDemo = (data) => {
  const html = buildInvoiceHtml(data);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const newWindow = window.open(url, "_blank");
  if (newWindow) {
    newWindow.focus();
  }
  setTimeout(() => URL.revokeObjectURL(url), 1000 * 60);
};


