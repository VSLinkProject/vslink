# Cài đặt và triển khai

## Chạy Mèo AI và Ghép câu trên máy

Worker chạy tại chỗ bằng `wrangler dev`, key Gemini chỉ nằm trên máy.

1. Lấy key Gemini tại https://aistudio.google.com/apikey.
2. Chép `worker/.dev.vars.example` thành `worker/.dev.vars`, dán key vào dòng `GEMINI_API_KEY=` (tệp này không lên git).
3. Chép `.env.example` thành `.env.local` để web gọi Worker ở `http://localhost:8787`.
4. Mở hai cửa sổ Terminal:
   ```bash
   npm run worker   # Worker tại chỗ (lần đầu tải wrangler khoảng 1 phút)
   npm run dev      # web
   ```
5. Mở http://localhost:5173/dich/, chọn thẻ Ghép câu, bật camera và ký từng từ (hạ tay giữa các từ). Nghỉ 3 giây là ra câu. Nếu chỉ thấy các từ nối nhau kèm dòng "Mèo chưa sắp xếp được thành câu lúc này" thì Worker chưa chạy hoặc chưa có key. Có thể kiểm tra nhanh ở `/kiem-tra/` → Hỏi thử Mèo → thấy "(AI)".

## Đưa lên GitHub Pages

1. Repo → Settings → Pages → Build and deployment → Source: GitHub Actions.
2. Workflow `dua-len-pages.yml` tự chạy sau mỗi lần push lên `main` (hoặc bấm Run workflow ở tab Actions). Khoảng 2–3 phút sau web có ở `https://<ten-tai-khoan>.github.io/vslink/`.
3. Trang `/kiem-tra/` và `/cong-cu/` không có trên bản công khai. Người dùng tự kiểm tra camera ở `/gop-y/` → Gặp sự cố? → Tự kiểm tra camera.

## Worker cho Mèo (Gemini)

API key không được nằm trong mã web vì ai cũng xem được mã nguồn trang. Key chỉ nằm trong Cloudflare Worker, đứng giữa web và Gemini.

1. Lấy key Gemini ở https://aistudio.google.com/apikey. Không commit key lên GitHub.
2. Cloudflare dashboard → Workers & Pages → Create → Create Worker → đặt tên (ví dụ `vslink-meo`) → Deploy → Edit code → dán toàn bộ [`worker/meo-worker.js`](../worker/meo-worker.js) → Deploy.
3. Worker → Settings → Variables and Secrets:

   | Tên | Loại | Giá trị |
   | --- | --- | --- |
   | `GEMINI_API_KEY` | Secret | key Gemini |
   | `ALLOWED_ORIGINS` | Text | `https://<ten-tai-khoan>.github.io` (thêm `,http://localhost:5173` nếu thử ở máy) |
   | `GEMINI_MODEL` | Text, không bắt buộc | ép dùng một model; bỏ trống thì Worker thử lần lượt các bản flash-lite |

4. Báo cho web địa chỉ Worker (dạng `https://vslink-meo.<ten-tai-khoan>.workers.dev`), chọn một cách:
   - Repo → Settings → Secrets and variables → Actions → Variables → thêm `MEO_API` = địa chỉ Worker, rồi chạy lại workflow.
   - Hoặc sửa `static/cau-hinh.json`: `{ "meo_api": "https://vslink-meo.<ten-tai-khoan>.workers.dev" }`.
5. Chạy `npm run dev`, mở `/kiem-tra/` → Hỏi thử Mèo. Thấy "(AI)" là xong; nếu vẫn "(lời soạn sẵn)" thì bấm Kiểm tra Worker để xem lý do (thiếu key, sai `ALLOWED_ORIGINS`, hết lượt…).

Worker chỉ nhận dữ kiện hợp lệ (từ phải thuộc 400 từ, số nằm trong khoảng cho phép) và chỉ trả lời các địa chỉ trong `ALLOWED_ORIGINS`, nên không ai dùng key này làm chatbot được. Gói miễn phí của Gemini có giới hạn lượt; hết lượt thì Mèo dùng lời soạn sẵn. Ở gói miễn phí, Google có thể dùng nội dung gửi lên để cải thiện dịch vụ; web chỉ gửi dữ kiện số, không gửi hình.

Dùng dòng lệnh thay cho dashboard: sửa `ALLOWED_ORIGINS` trong `worker/wrangler.toml`, rồi `cd worker && npx wrangler deploy` và `npx wrangler secret put GEMINI_API_KEY`.

## Góp ý về Google Sheet

Đường đi: web → Worker (`{"loai":"gop-y"}`) → Google Apps Script → một dòng mới trong Sheet. Web không biết địa chỉ Sheet; Worker giữ địa chỉ và khoá bí mật. Góp ý chỉ gồm chữ người dùng viết và kết quả nhận dạng đính kèm, không có hình camera.

1. Tạo Google Sheet (ví dụ "VSLink – Góp ý") và chia sẻ cho nhóm.
2. Tiện ích mở rộng → Apps Script → dán [`worker/gop-y-apps-script.gs`](../worker/gop-y-apps-script.gs). Đổi `const KHOA = '...'` thành một chuỗi ngẫu nhiên dài → Lưu.
3. Triển khai → Triển khai mới → Ứng dụng web; Thực thi với tư cách: Tôi; Người có quyền truy cập: Bất kỳ ai → copy URL ứng dụng web.
4. Worker → Settings → Variables and Secrets → thêm hai Secret: `GOP_Y_URL` (URL vừa copy) và `GOP_Y_KHOA` (chuỗi ở bước 2).
5. Dán lại `worker/meo-worker.js` mới nhất vào Worker → Deploy. Góp ý chạy được cả khi chưa có `GEMINI_API_KEY`.
6. Mở `/gop-y/` và gửi thử. Cột Trạng thái trong Sheet có sẵn các giá trị Mới / Đang xử lý / Đã trả lời / Đã sửa / Bỏ qua.

Khi chưa cài, trang góp ý báo "Kênh góp ý đang được nhóm cài đặt". Worker chặn spam bằng ô bẫy ẩn và giới hạn 5 góp ý / 10 phút mỗi máy. Sửa `KHOA` hay sửa Apps Script thì phải Triển khai → Quản lý triển khai → Chỉnh sửa → Phiên bản mới (URL giữ nguyên).
