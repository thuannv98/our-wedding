# Thiệp cưới

Trang tĩnh, không cần máy chủ. Đẩy thẳng lên GitHub Pages là chạy.

## Sửa nội dung

Mở `index.html`, tìm `window.__AK_DATA__` (gần cuối file). Toàn bộ phần thay đổi được
nằm trong khối JSON đó:

- `coDau`, `chuRe` — tên, bố mẹ, tư gia, đoạn giới thiệu, lời nhắn
- `le.thanhLe`, `le.tiecNhaGai`, `le.tiecNhaTrai` — giờ, ngày (dạng `2030-03-24`), nơi, địa chỉ, link bản đồ
- `chu` — các đoạn văn dài: lời mời, chuyện chúng mình, đôi lời ngỏ, lời cảm ơn
- `hinh` — đường dẫn ảnh, thay file trong thư mục `img/` rồi sửa tên ở đây
- `form` — endpoint Apps Script và mã bí mật

Đổi `ngay` là thứ trong tuần, ngày âm, và vị trí đánh dấu trên lịch **tự tính lại**.
Không phải sửa tay chỗ nào khác.

## Nhận xác nhận và lời chúc vào Google Sheet

1. Tạo một Google Sheet bằng tài khoản Google **cá nhân**
2. Tiện ích mở rộng → Apps Script, dán toàn bộ `apps-script.gs`
3. Đổi `BI_MAT` thành một chuỗi bất kỳ
4. Triển khai → Tùy chọn triển khai mới → Ứng dụng web
   - Thực thi với tư cách: **Tôi**
   - Ai có quyền truy cập: **Bất kỳ ai**
5. Chép URL nhận được, dán vào `__AK_DATA__.form.endpoint`
6. Dán cùng chuỗi `BI_MAT` vào `__AK_DATA__.form.biMat`

Sheet vẫn riêng tư. Script chạy dưới quyền bạn và chỉ biết thêm dòng.
Hai sheet `XacNhan` và `LoiChuc` sẽ tự tạo khi có người gửi đầu tiên.

Để trống `endpoint` thì form chỉ lưu trong trình duyệt khách, không gửi đi đâu.

## Đưa lên GitHub Pages

```bash
cd ~/thiep-cuoi
git init && git add -A && git commit -m "thiệp cưới"
git branch -M main
git remote add origin git@github.com:<tài-khoản>/<repo>.git
git push -u origin main
```

Rồi vào Settings → Pages của repo, chọn nhánh `main`, thư mục `/ (root)`.

File `.nojekyll` đã có sẵn để GitHub không bỏ qua thư mục nào.
