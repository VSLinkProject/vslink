# Công cụ cho nhóm

Các trang này chỉ mở được khi chạy `npm run dev` hoặc build với `VITE_CONG_CU_NHOM=1`, không có trên web công khai.

## Kiểm tra hệ thống (`/kiem-tra/`)

So kết quả mô hình trên trình duyệt với Python, thử camera và MediaPipe, thử Mèo AI và chẩn đoán Worker.

Để so với video thật từ notebook: chép `vi_du_kiem_tra.json` (notebook xuất ra) vào `static/kiem-tra/`, trang sẽ so top-5 của trình duyệt với notebook.

## Chọn video mẫu (`/cong-cu/video-mau/`)

Một nghĩa có thể có nhiều cách ký (Bắc, Trung, Nam…), nên video mẫu phải đúng cách mà mô hình chấm. Trang này làm việc đó ngay trên trình duyệt:

1. Nối QIPEDC: bấm Mở QIPEDC → ở tab QIPEDC mở F12 → Console → dán đoạn lệnh của trang (lần đầu Chrome yêu cầu gõ `allow pasting`). Đoạn lệnh chỉ đọc danh sách công khai và tải video QIPEDC giúp trang công cụ, vì trình duyệt không cho trang khác đọc hình video QIPEDC trực tiếp. Để tab QIPEDC mở trong lúc chấm.
2. Khớp tên 400 từ với danh sách QIPEDC: trùng tên → bỏ phần trong ngoặc → bỏ "con / quả / cái / màu…".
3. Chấm: mỗi video chạy qua MediaPipe và mô hình như khi tải video lên; cách ký nào mô hình nhận rõ nhất thành video chính. Có thể tạm dừng và chấm tiếp, kết quả lưu trên máy đó.
4. Duyệt nhóm "Cần xem": xem thử, Chọn cách đúng, Tìm thêm khi tên trên QIPEDC khác tên VSL400, hoặc Không dùng.
5. Xuất `video-mau.json` (mặc định chỉ gồm các từ "Khớp tốt") → chép đè vào `static/du-lieu/` → commit.

Web chỉ dùng video đã chấm hoặc duyệt. Từ chưa có video hiện thông báo "đang duyệt lại"; Đố vui kiểu xem video chỉ hỏi những từ đã duyệt (chưa đủ 4 từ thì tạm khoá). Cách ký miền khác chỉ hiện khi chính video đó cũng đạt "Khớp tốt".

## Khung xương mẫu cho từ chưa có video

Từ chưa có video thật thì trang Học (và gợi ý trong Đố vui) phát khung xương của một lần ký thật trong VSL400, tức chính dữ liệu mô hình đã học. Mỗi từ lấy lần ký tiêu biểu nhất (medoid: gần với mọi lần ký khác của từ đó nhất) trong số các lần mà `vsl400.onnx` nhận đúng hạng 1 với độ chắc từ 50 % trở lên, rồi kiểm lại bản sẽ hiện trên web vẫn đạt chuẩn đó. Nhóm không lấy trung bình nhiều người vì trung bình làm mờ dáng bàn tay, thu nhỏ động tác, và người thuận tay trái, phải triệt tiêu nhau.

1. Kaggle → notebook mới → Add Input dataset keypoint VSL400 → bật Internet → dán `nghien-cuu/khung-mau/xuat_khung_mau_kaggle.py` vào một ô → Run (CPU, vài phút).
2. Tải `khung-mau.zip` ở tab Output, giải nén vào `static/du-lieu/` (thành `static/du-lieu/khung-mau/`) → commit.

Web chỉ dùng từ có `"kiem_chung": true`; từ đã có video thì vẫn hiện video. Kiểm thử phần xuất: `cd nghien-cuu/khung-mau && python -m pytest -q`.
