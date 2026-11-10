# VSLink

Web nhận dạng 400 từ Ngôn ngữ Ký hiệu Việt Nam (VSL) qua camera và giúp người nghe học ký hiệu. Mô hình chạy hoàn toàn trên trình duyệt, hình ảnh không rời khỏi máy người dùng. Linh vật của web là chú chó Mèo, nhận xét sau mỗi lần ký.

Dự án của nhóm học sinh lớp 11, Trường Phổ thông Năng khiếu (ĐHQG-HCM). Mô hình nhận dạng huấn luyện ở repo [vslink-spoter](https://github.com/VSLinkProject/vslink-spoter).

<p align="center">
  <img src="docs/anh/trang-chu.webp" width="720" alt="Trang chủ VSLink">
</p>

| Tập ký một từ | Dịch trên điện thoại |
| --- | --- |
| <img src="docs/anh/tap-ky.webp" width="480" alt="Tập ký"> | <img src="docs/anh/dich-dien-thoai.webp" width="240" alt="Dịch trên điện thoại"> |

Ảnh chụp ở chế độ giả lập (`?gia-lap=1`): một "người que" ký thay camera và video mẫu là video giả. Bản thật dùng camera và video của Từ điển Ngôn ngữ ký hiệu QIPEDC.

## Tính năng

| Trang | Chức năng |
| --- | --- |
| Dịch | Ký trước camera, web tự nhận lúc bắt đầu và kết thúc (giơ tay, ký, hạ tay). Hiện 5 từ khả năng nhất kèm %, cảnh báo khi chưa chắc. Có thể tải video lên. |
| Ghép câu (thử nghiệm) | Ký từng từ; top-3 của mỗi từ được gửi tới Gemini để chọn từ hợp ngữ cảnh và đổi trật tự ký hiệu sang câu tiếng Việt. Không có Worker thì nối từ theo thứ tự ký. Nghiên cứu ở [`nghien-cuu/ghep-cau/`](nghien-cuu/ghep-cau/README.md). |
| Học | Thư viện 400 từ, 19 chủ đề, tìm không dấu. Mỗi lần ký được chấm Đúng / Gần đúng / Chưa đúng, chỉ ra bàn tay hay đoạn nào khác mẫu, rồi Mèo nhận xét. |
| Đố vui | Xem ký hiệu đoán nghĩa, hoặc thấy chữ rồi tự ký. |
| Tiến độ | Chuỗi ngày học, từ đã thuộc, ôn tập giãn cách theo hộp Leitner (1, 2, 4, 7, 15 ngày). Lưu trên trình duyệt, không cần tài khoản. |
| Về dự án, Góp ý | Giới thiệu nhóm, cách web hoạt động, giới hạn. Góp ý được gửi về Google Sheet của nhóm. |

## Cách hoạt động

```
Camera → MediaPipe Holistic → 75 điểm/khung → khung vuông → cắt đoạn → 60 khung → mô hình ONNX → 400 xác suất
         (33 thân + 21×2 tay)   (x, y)          (như VSL400)  (theo giây)   (linspace)   (SPOTER)
```

- Tay trái, tay phải gán theo cơ thể người ký trên ảnh gốc, chỉ lật gương khi hiển thị, để khớp với dữ liệu huấn luyện.
- VSL400 quay ở khung 1080×1080, nên webcam 16:9 được đệm thành khung vuông ảo (không cắt hình) để dáng người không bị kéo dãn.
- Cắt đoạn tự động (`src/lib/loi/cat-doan.ts`) là một máy trạng thái CHỜ → ĐANG KÝ → ĐANG CHẤM → NGHỈ; mọi ngưỡng tính bằng giây nên không phụ thuộc tốc độ máy.
- Khi ký trực tiếp, 60 khung được lấy cách đều theo thời gian (nội suy, `lay-mau.ts`) để máy giật hình không làm lệch nhịp động tác.
- Chấm khi học (`src/lib/loi/danh-gia.ts`): Đúng là từ đó đứng hạng 1, Gần đúng là hạng 2–5. Bộ phận và đoạn khác mẫu được đo bằng phân tích che bớt (Zeiler & Fergus, 2014): che từng bàn tay, cánh tay, hoặc "đứng hình" từng đoạn, rồi xem xác suất thay đổi thế nào. Cả 7 biến thể chạy trong một lần gọi mô hình.
- Mèo nhận xét: web chỉ gửi dữ kiện đã đo (từ, hạng, %, nhãn bộ phận), không gửi hình hay toạ độ, tới Cloudflare Worker để Gemini diễn đạt lại. Đúng hay sai luôn do mô hình quyết định. Không có mạng hoặc hết lượt thì Mèo dùng lời soạn sẵn.

## Số liệu mô hình

Tập kiểm tra VSL400: 9.751 video của 10 người ký mà mô hình chưa gặp khi huấn luyện.

| | Kết quả |
| --- | --- |
| Top-1 | 89,51 % |
| Top-5 | 97,81 % |
| So với mô hình trước (89,31 %) | McNemar p = 0,116, chưa khác biệt có ý nghĩa thống kê |
| ONNX Runtime Web so với Python | lệch < 0,0001, từ đoán trùng 100 % (kiểm ở `/kiem-tra/`) |

Với webcam ngoài phòng quay (ánh sáng, góc máy khác), độ chính xác có thể thấp hơn, nên web luôn hiện 5 khả năng.

## Chạy thử

Cần Node.js 22.12 trở lên.

```bash
npm install
npm run dev
```

Mở http://localhost:5173. Camera chỉ chạy ở `localhost` hoặc `https`. Không có camera thì thêm `?gia-lap=1` (ví dụ `/dich/?gia-lap=1`) để "người que" ký thay. Lần đầu mở camera, web tải mô hình MediaPipe (hơn 10 MB) và mô hình ký hiệu (14 MB).

Cài Worker cho Mèo AI, Ghép câu, góp ý và đưa lên GitHub Pages: xem [`docs/cai-dat.md`](docs/cai-dat.md). Trang kiểm tra hệ thống và công cụ chọn video mẫu cho nhóm: xem [`docs/cong-cu-nhom.md`](docs/cong-cu-nhom.md).

## Kiểm thử

```bash
npm test                          # kiểm thử đơn vị (79)
npm run check                     # kiểm tra kiểu TypeScript / Svelte
npx playwright install chromium   # lần đầu
npm run test:e2e                  # end-to-end trên bản build, máy tính và điện thoại
```

- Đơn vị (`tests/unit/`): lấy 60 khung khớp `np.linspace` của notebook, đổi toạ độ sang khung vuông, gán tay, cắt đoạn (máy nhanh/chậm, rung tay, mất người, ký quá ngắn), chấm và che bớt, lời Mèo, hộp Leitner, Worker với Gemini giả lập, khớp tên QIPEDC.
- End-to-end (`tests/e2e/`): ONNX Runtime Web khớp Python; mọi trang mở không lỗi, không tràn ngang; luồng Dịch / Học / Đố vui / Tiến độ bằng người que; Worker giả lập chỉ nhận đúng 12 trường dữ kiện; công cụ chọn video mẫu với trang QIPEDC giả. Chạy được cả với `BASE_PATH=/vslink` như trên GitHub Pages.

## Giới hạn

- Chỉ 400 từ đơn, ký từng từ một. Ghép câu vẫn phải hạ tay giữa các từ, và câu còn đơn giản vì bộ từ thiếu đại từ, từ hỏi.
- MediaPipe Holistic tính cả lưới khuôn mặt nên máy yếu có thể dưới 6 hình/giây; khi đó nên dùng Tải video lên.
- Video HEVC của một số điện thoại không mở được trên Chrome/Edge; nên quay H.264 hoặc WebM.
- Video mẫu phát trực tiếp từ QIPEDC; nếu bị chặn, web hiện nút mở ở tab mới.
- Tiến độ lưu theo trình duyệt, đổi máy hoặc xoá dữ liệu trình duyệt là mất.
- Khung xương mẫu (cho từ chưa có video) không có nét mặt, mỗi bàn tay chỉ 21 điểm.

## Vai trò của AI

- Trong sản phẩm: Gemini (Google), gọi qua Cloudflare Worker, dùng cho Ghép câu và lời nhận xét của Mèo. Gemini chỉ nhận dữ kiện dạng chữ và số, không nhận hình ảnh, và không quyết định đúng sai.
- Khi làm repo: nhóm dùng Claude (Anthropic) hỗ trợ viết phần lớn mã web (giao diện, nhận dạng trên trình duyệt, phân tích che bớt, Ghép câu) và xuất mô hình sang ONNX. Nhóm lên ý tưởng, đọc lại, chỉnh sửa, tích hợp và kiểm tra bằng kiểm thử đơn vị, end-to-end và so kết quả ONNX với Python. Một số commit có ghi `Co-Authored-By: Claude` trong lịch sử git, nhưng không phải mọi phần có AI hỗ trợ đều được đánh dấu như vậy.

## Cấu trúc thư mục

```
src/lib/loi/          lõi: keypoint, cắt đoạn, lấy mẫu, ONNX, MediaPipe, chấm + che bớt, camera
src/lib/meo/          Mèo: hình, lời soạn sẵn, gọi Worker
src/lib/cau/          Ghép câu
src/lib/kho/          tiến độ, hộp Leitner (localStorage)
src/lib/hoc/          thư viện từ, trang tập ký
src/lib/thanh-phan/   khung camera, video mẫu, top 5, bảng bộ phận
src/lib/cong-cu/      công cụ chọn video mẫu
src/routes/           các trang
static/models/        vsl400.onnx (vào [B, 60, 75, 2] → ra [B, 400])
static/du-lieu/       video-mau.json, khung-mau/
worker/               Cloudflare Worker (Mèo, Ghép câu, góp ý)
nghien-cuu/           ghép câu (gloss → câu), xuất khung xương mẫu
scripts/              chép wasm, tải mô hình MediaPipe, tạo dữ liệu
```

## Tài liệu tham khảo

- Boháček, M., & Hrúz, M. (2022). Sign pose-based transformer for word-level sign language recognition. *WACV Workshops*.
- Grishchenko, I., & Bazarevsky, V. (2020). *MediaPipe Holistic: Simultaneous face, hand and pose prediction, on device*. Google AI Blog.
- Zeiler, M. D., & Fergus, R. (2014). Visualizing and understanding convolutional networks. *ECCV*.
- McNemar, Q. (1947). Note on the sampling error of the difference between correlated proportions or percentages. *Psychometrika*.
- Leitner, S. (1972). *So lernt man lernen*. Herder.
- Cepeda, N. J., et al. (2006). Distributed practice in verbal recall tasks. *Psychological Bulletin*.
- W3C. (2018). *Web Content Accessibility Guidelines (WCAG) 2.1*.
- Bộ dữ liệu VSL400; video mẫu từ Từ điển Ngôn ngữ ký hiệu, dự án QIPEDC, Bộ GD&ĐT (qipedc.moet.gov.vn).
- Thư viện: ONNX Runtime Web, MediaPipe Tasks Vision, SvelteKit, Lucide, Nunito.

## Giấy phép

Mã nguồn theo GPL-3.0 ([LICENSE](LICENSE)). Video mẫu thuộc QIPEDC; mô hình huấn luyện trên VSL400 và tuân theo điều khoản của bộ dữ liệu. Linh vật Mèo được vẽ riêng cho dự án.
