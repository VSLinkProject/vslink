/**
 * VSLink — nhận góp ý từ Worker và ghi vào Google Sheet của nhóm.
 *
 * Cài đặt (xem docs/cai-dat.md, mục "Góp ý về Google Sheet"):
 *  1. Tạo một Google Sheet mới → Tiện ích mở rộng → Apps Script → xoá hết, dán tệp này → Lưu.
 *  2. Đổi KHOA bên dưới thành một chuỗi bí mật dài (ví dụ 32 ký tự ngẫu nhiên).
 *  3. Triển khai → Tùy chọn triển khai mới → Loại: Ứng dụng web
 *       Thực thi với tư cách: Tôi · Người có quyền truy cập: Bất kỳ ai → Triển khai → cấp quyền.
 *  4. Copy "URL ứng dụng web" → Worker: Secret GOP_Y_URL; chuỗi KHOA → Secret GOP_Y_KHOA.
 *
 * Chỉ Worker biết KHOA, nên người ngoài không ghi thẳng vào Sheet được.
 */
const KHOA = 'DOI-THANH-CHUOI-BI-MAT-CUA-NHOM';
const TEN_TRANG = 'Góp ý';
const COT = ['Thời điểm', 'Loại', 'Nội dung', 'Đúng ra phải là', 'Liên hệ', 'Người Điếc/khiếm thính', 'Trang',
  'Từ Mèo đoán', 'Câu Mèo ghép', 'Trình duyệt', 'Trạng thái', 'Ghi chú của nhóm'];
const TEN_LOAI = { 'doan-sai': 'Mèo đoán sai từ', 'cau-sai': 'Câu ghép chưa đúng', 'loi-web': 'Lỗi web',
  'de-xuat': 'Đề xuất', khac: 'Khác' };

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.khoa !== KHOA) return traVe({ ok: false, loi: 'sai khoa' });
    const sh = layTrang();
    // Ghi dạng văn bản thuần để Sheet không hiểu nhầm ô bắt đầu bằng = + - @ là công thức
    const vb = (x) => (typeof x === 'string' && /^[=+\-@]/.test(x) ? "'" + x : x);
    sh.appendRow([
      new Date(), TEN_LOAI[d.the_loai] || d.the_loai, vb(d.noi_dung), vb(d.dung_ra || ''), vb(d.lien_he || ''),
      d.nguoi_diec ? 'Có' : '', d.trang || '', (d.tu_doan || []).join(', '), vb(d.cau || ''), d.trinh_duyet || '',
      'Mới', ''
    ]);
    return traVe({ ok: true });
  } catch (err) {
    return traVe({ ok: false, loi: String(err) });
  }
}

function layTrang() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(TEN_TRANG);
  if (!sh) {
    sh = ss.insertSheet(TEN_TRANG);
    sh.appendRow(COT);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, COT.length).setFontWeight('bold');
    sh.getRange('K2:K').setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(['Mới', 'Đang xử lý', 'Đã trả lời', 'Đã sửa', 'Bỏ qua']).build()
    );
  }
  return sh;
}

function traVe(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
