/**
 * Nhận xác nhận tham dự và lời chúc từ trang thiệp cưới, ghi vào hai sheet.
 *
 * CÀI ĐẶT
 *  1. Mở Google Sheet của bạn, vào Tiện ích mở rộng > Apps Script
 *  2. Dán toàn bộ file này, thay BI_MAT bên dưới bằng một chuỗi bất kỳ
 *  3. Bấm Triển khai > Tùy chọn triển khai mới > Ứng dụng web
 *       Thực thi với tư cách: Tôi
 *       Ai có quyền truy cập: Bất kỳ ai
 *  4. Chép URL nhận được, dán vào __AK_DATA__.form.endpoint trong index.html
 *  5. Dán cùng chuỗi BI_MAT vào __AK_DATA__.form.biMat
 *
 * Sheet vẫn riêng tư. Script chạy dưới quyền bạn; khách chỉ gọi được script này,
 * và script chỉ biết thêm dòng, không đọc, không sửa, không xoá.
 */

var BI_MAT = 'doi-chuoi-nay-di';     // phải khớp với biMat trong trang
var TOI_DA_MOI_PHUT = 20;            // chặn spam: số dòng tối đa mỗi phút

function doGet() {                   // mở URL bằng trình duyệt thì không thấy gì
  return ContentService.createTextOutput('');
}

function doPost(e) {
  try {
    var p = (e && e.parameter) || {};

    if (p.biMat !== BI_MAT) return ok();                 // thiếu mã thì bỏ qua lặng lẽ
    if (p.website) return ok();                          // bẫy bot: ô ẩn phải rỗng
    var ten = String(p.ten || '').trim();
    if (!ten || ten.length > 80) return ok();             // không tên hoặc tên vô lý
    if (['xacnhan', 'loichuc'].indexOf(p.loai) < 0) return ok();
    if (quaNhanh_()) return ok();

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (p.loai === 'xacnhan') {
      sheet_(ss, 'XacNhan', ['Thời điểm', 'Họ tên', 'Tham dự', 'Nơi tham dự', 'Số người', 'Lời nhắn'])
        .appendRow([new Date(), ten, cut_(p.thamDu, 40), cut_(p.noi, 60), cut_(p.soNguoi, 10), cut_(p.loiNhan, 500)]);
    } else {
      sheet_(ss, 'LoiChuc', ['Thời điểm', 'Họ tên', 'Quan hệ', 'Lời chúc'])
        .appendRow([new Date(), ten, cut_(p.quanHe, 60), cut_(p.loiChuc, 500)]);
    }
  } catch (err) {
    // nuốt lỗi: trang không đọc được phản hồi nên báo lỗi ra ngoài cũng vô ích
  }
  return ok();
}

function ok() { return ContentService.createTextOutput(''); }
function cut_(v, n) { return String(v == null ? '' : v).slice(0, n); }

function sheet_(ss, ten, tieuDe) {
  var sh = ss.getSheetByName(ten);
  if (!sh) {
    sh = ss.insertSheet(ten);
    sh.appendRow(tieuDe);
    sh.setFrozenRows(1);
  }
  return sh;
}

function quaNhanh_() {
  var c = CacheService.getScriptCache();
  var key = 'dem-' + Math.floor(Date.now() / 60000);
  var n = Number(c.get(key) || 0) + 1;
  c.put(key, String(n), 120);
  return n > TOI_DA_MOI_PHUT;
}
