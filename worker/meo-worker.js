// Cloudflare Worker cua VSLink: giu key Gemini (khong de trong web), nhan xet cho Meo,
// ghep cau va chuyen gop y sang Google Sheet. Cach cai: docs/cai-dat.md.
//
// Bien moi truong:
//   GEMINI_API_KEY   (Secret)            key Gemini
//   ALLOWED_ORIGINS  (tuy chon)          vd "https://ten-ban.github.io"; bo trong = moi noi goi duoc
//   GEMINI_MODEL     (tuy chon)          ep mot model; khong co thi thu lan luot DS_MODEL
//   GOP_Y_URL        (Secret, tuy chon)  Web App Apps Script nhan gop y (gop-y-apps-script.gs)
//   GOP_Y_KHOA       (Secret, tuy chon)  trung voi KHOA trong Apps Script
//
// Worker chi nhan du kien web da do (tu phai thuoc 400 tu, so nam trong khoang cho phep),
// nen khong ai dung key nay lam chatbot tuy y duoc.

// Model nao da ngung (404/400) thi tu thu model sau (danh sach cap nhat 9/2026).
const DS_MODEL = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.5-flash', 'gemini-2.5-flash-lite'];
const NHAN = new Set(["Anh", "Ba lô", "Bia", "Buổi chiều", "Buổi sáng", "Buổi trưa", "Buổi tối", "Bà ngoại", "Bà nội", "Bàn phím", "Bác", "Bác sĩ", "Bánh bao", "Bánh chưng", "Bánh tét", "Bánh xèo", "Báo cáo", "Bây giờ", "Bình minh", "Bóng bàn", "Bóng chuyền", "Bóng rổ", "Bóng đá", "Bún", "Bút bi", "Bút chì", "Bơi lội", "Bảng", "Bảo vệ", "Bận", "Bắt buộc", "Bắt chước", "Bệnh viện", "Bố", "Ca sĩ", "Cao (người)", "Cao (đồ vật)", "Cay", "Cho", "Chua", "Cháu", "Chìa khóa", "Chú", "Chú ý", "Chăm chỉ", "Chơi cờ", "Chạy", "Chậm chạp", "Chật", "Chết", "Chị", "Chồng", "Chợ", "Chụp hình", "Chủ nhật", "Chủ tịch", "Con bò", "Con chó", "Con dê", "Con gà", "Con gái", "Con heo", "Con mèo", "Con rùa", "Con thỏ", "Con trai", "Con trâu", "Con vịt", "Cung cấp", "Cà phê", "Cái bàn", "Cái chảo", "Cái cửa", "Cái ghế", "Cái kéo", "Cái nồi", "Cái quần", "Cái áo", "Cái đèn", "Có", "Cô", "Công ty", "Công viên", "Cũ", "Cười", "Cảm thấy", "Cảm ơn", "Cần", "Cầu lông", "Cậu", "Cắm trại", "Cục tẩy", "Cứng", "Cửa sổ", "Diễn viên", "Dài", "Dây chuyền", "Dép", "Dì", "Dũng cảm", "Dơ", "Dễ", "Dỗi", "Dở", "Dụng cụ học tập", "Dừng lại", "Dữ", "Em", "Ghét", "Già", "Giàu", "Giày", "Giám đốc", "Giáng sinh", "Giây", "Gió", "Giúp đỡ", "Giường", "Giấy nháp", "Giặt đồ", "Giỏi", "Giới thiệu", "Giờ", "Gạo", "Gần", "Gọi", "Gối (đầu)", "Gội đầu", "Hay (khen)", "Hiền", "Hiệu trưởng", "Hoàng hôn", "Hy vọng", "Hài hước", "Hàn Quốc", "Hát", "Hôi", "Hư", "Hẹp", "Họ hàng", "Học", "Học sinh", "Hứa", "Kem", "Khoe khoang", "Khám bệnh", "Khó", "Khóc", "Khô", "Không cho", "Không cần", "Không nghe lời", "Không nên", "Không quen", "Khăn quàng cổ", "Khỏe", "Kính lúp", "Kẹo", "Kẹp tóc", "Kế toán", "Laptop", "Luật sư", "Làm bài tập", "Làm việc", "Lùn", "Lười biếng", "Lạnh", "Lễ tân", "Mua bán", "Muốn", "Màu cam", "Màu hồng", "Màu nâu", "Màu trắng", "Màu tím", "Màu vàng", "Màu xanh da trời", "Màu xanh lá cây", "Màu đen", "Màu đỏ", "Mách", "Mát mẻ", "Máy bay", "Máy chiếu", "Máy giặt", "Máy tính cầm tay", "Máy điều hòa", "Mì gói", "Mùa hè", "Mùa khô", "Mùa mưa", "Mùa thu", "Mùa xuân", "Mùa đông", "Múa", "Mũ", "Mũ bảo hiểm", "Mưa", "Mạnh", "Mập", "Mặn", "Mẹ", "Mềm", "Mền", "Mệt", "Mới", "Mỹ", "Nghe", "Nghèo", "Nghề nghiệp", "Nghỉ ngơi", "Ngoan", "Ngon miệng", "Ngu ngốc", "Ngày", "Ngày Nhà giáo Việt Nam", "Ngày Quốc tế Lao động", "Ngày Quốc tế Phụ nữ", "Ngày Quốc tế Thiếu nhi", "Ngân hàng", "Ngắn", "Ngọt", "Ngủ", "Ngửi", "Nhanh", "Nhà", "Nhà hàng", "Nhà sách", "Nhà trọ", "Nhân viên phục vụ", "Nhân viên văn phòng", "Nhạt", "Nhảy cao", "Nhảy dây", "Nhầm lẫn", "Nhật Bản", "Nhẹ", "Nên", "Nói", "Nói chuyện", "Nóng", "Nông dân", "Năm", "Nước", "Nướng", "Nấu", "Nắng", "Nặng", "Nếm", "Nồi cơm điện", "Phút", "Phơi đồ", "Phở", "Quan sát", "Quen", "Quán cà phê", "Quạt (đứng)", "Quả bơ", "Quả cam", "Quả chuối", "Quả dâu", "Quả dứa", "Quả dừa", "Quả mận", "Quả xoài", "Quả đu đủ", "Quả đào", "Quả địa cầu", "Quần thun", "Quần tây", "Quần đùi", "Rượu", "Rạp chiếu phim", "Rẻ", "Rộng", "Rửa chén", "Rửa mặt", "Rửa tay", "Sai", "Sinh viên", "Siêu thị", "Sách", "Sáng tạo", "Sạch sẽ", "Sớm", "Sữa", "Taxi", "Tham lam", "Tham ăn", "Thay đổi", "Thuyền", "Thành phố", "Thái Lan", "Tháng", "Tháng ba", "Tháng bảy", "Tháng chín", "Tháng hai", "Tháng mười", "Tháng mười hai", "Tháng mười một", "Tháng một", "Tháng năm", "Tháng sáu", "Tháng tám", "Tháng tư", "Thèm", "Thích", "Thông minh", "Thú vị", "Thơm", "Thư ký", "Thước kẻ", "Thấp (đồ vật)", "Thể dục (thể thao)", "Thịt", "Thời gian", "Thời tiết", "Thứ ba", "Thứ bảy", "Thứ hai", "Thứ năm", "Thứ sáu", "Thứ tư", "Thức dậy", "Thử", "Tivi", "Tiếp tục", "Trung Quốc", "Trung thu", "Trà", "Trường Cao đẳng", "Trường học", "Trường Đại học", "Trẻ", "Trễ", "Trứng", "Trực thăng", "Tàu hỏa", "Tìm", "Túi xách", "Tường", "Tắm rửa", "Tết Âm lịch", "Tỉnh", "Tốt bụng", "Tủ lạnh", "Từ chối", "Uống", "Viên phấn", "Viết", "Việt Nam", "Vâng lời", "Vòng tay", "Võ", "Vở", "Vợ", "Xa", "Xe buýt", "Xe máy", "Xe tải", "Xe đạp", "Xem", "Xin", "Xin lỗi", "Xôi", "Xấu (người)", "Xấu (vật)", "Y tá", "Yên tĩnh", "Yêu thương", "Yếu", "Áo sơ mi", "Áo thun", "Áo đầm", "Ô tô", "Ông ngoại", "Ông nội", "Ăn", "Đau", "Đi", "Điền kinh", "Điện thoại", "Đá cầu", "Đúng", "Đầu bếp", "Đậm", "Đắng", "Đắt", "Đẹp (người)", "Đẹp (vật)", "Đọc", "Đồ buộc tóc", "Đồ dùng", "Đồng hồ đeo tay", "Đồng ý", "Ướt", "Ấm", "Ốm", "Ồn ào"]);
const MUC_DO = new Set(['dung', 'gan-dung', 'chua-dung']);
const DANH_GIA_PHAN = new Set(['khop', 'on', 'hoi-lech', 'lech-nhieu', 'khong-thay']);
const GIAI_DOAN = new Set(['dau', 'giua', 'cuoi']);

const HE_THONG = `Bạn là Mèo — một chú chó con (tên là Mèo, đúng vậy, chó tên Mèo) làm trợ giảng trong ứng dụng học Ngôn ngữ Ký hiệu Việt Nam VSLink. Người học vừa ký thử một từ. Một mô hình nhận dạng đã chấm và đo sẵn các dữ kiện dưới đây (JSON).
Quy tắc:
- Chỉ dựa vào dữ kiện đã cho. Không bịa thêm chi tiết về động tác, hình dạng ngón tay hay ý nghĩa ký hiệu mà dữ kiện không nói.
- Kết luận lấy NGUYÊN từ muc_do: "dung" = đúng, "gan-dung" = gần đúng, "chua-dung" = chưa đúng. Không được đổi kết luận.
- bo_phan (theo mô hình): tayTrai / tayPhai = hình dạng bàn tay trái / phải của người ký; canhTay = vị trí và đường đi của tay. "lech-nhieu" = khác mẫu nhiều, "hoi-lech" = hơi khác, "khop" = rất giống mẫu, "khong-thay" = camera ít thấy bàn tay đó (có thể từ này chỉ dùng một tay, nên chỉ nhắc nhẹ: nếu từ cần tay đó thì để tay lọt vào khung hình), "on" = bình thường, không cần nhắc. Ưu tiên nhắc phần "lech-nhieu" trước, rồi "hoi-lech". Khi muc_do là "dung" thì chỉ khen, không bắt lỗi.
- giai_doan_lech_nhat: đoạn đầu / giữa / cuối của động tác khác mẫu nhiều nhất (null = không rõ).
- Giọng Mèo: thân thiện, dí dỏm như một chú cún con (được đùa nhẹ đúng MỘT câu, kiểu vẫy đuôi, đánh hơi, "gâu"), nhưng không lan man.
- Đầy đủ mà súc tích: 3 đến 5 câu ngắn, tổng dưới 90 từ, phải có đủ:
  (1) kết luận kèm số: độ chắc (xac_suat đổi ra %, làm tròn) và hạng trên 400 từ; nếu chưa đúng thì nói mô hình đang tưởng là từ nào (tu_doan);
  (2) nếu chưa đúng: nhắc mọi bộ phận "lech-nhieu" hoặc "hoi-lech" và đoạn khác mẫu nhất (nếu có), gộp gọn trong một câu;
  (3) nếu chưa đúng: 1 đến 2 mẹo làm được ngay, gắn đúng phần lệch (ví dụ xem video mẫu ở tốc độ 0,5×, bật soi gương, để ý đoạn giữa); nếu ti_le_thay_tay_trai hoặc ti_le_thay_tay_phai dưới 0.6 hoặc thoi_luong_giay dưới 0.8 thì nhắc cách quay (để tay trong khung hình, ký chậm lại);
  (4) nếu muc_do là "dung": khen kèm độ chắc, nhắc phần "khop" nếu có, không bắt lỗi.
- Không khen hay chê những gì dữ kiện không có: không nói "tiến bộ", "lần trước", "luyện nhiều rồi"…; không tả ngón tay, hướng tay cụ thể.
- Viết tiếng Việt, xưng "Mèo", gọi người học là "bạn". Chỉ mở đầu bằng "Gâu!" khi hợp, đừng câu nào cũng gâu.
- Không dùng markdown, không gạch đầu dòng, không emoji.`;

const so = (x, a, b) => (typeof x === 'number' && Number.isFinite(x) && x >= a && x <= b ? x : null);

function kiemDuKien(d) {
  if (!d || typeof d !== 'object') return null;
  const tu = (x) => (typeof x === 'string' && NHAN.has(x) ? x : null);
  const ra = {
    tu_muc_tieu: tu(d.tu_muc_tieu),
    muc_do: MUC_DO.has(d.muc_do) ? d.muc_do : null,
    xep_hang: so(d.xep_hang, 1, 400),
    xac_suat: so(d.xac_suat, 0, 1),
    tu_doan: tu(d.tu_doan),
    xac_suat_tu_doan: so(d.xac_suat_tu_doan, 0, 1),
    top3: Array.isArray(d.top3) ? d.top3.slice(0, 3).map((t) => ({ tu: tu(t?.tu), p: so(t?.p, 0, 1) })) : [],
    bo_phan: {},
    giai_doan_lech_nhat: GIAI_DOAN.has(d.giai_doan_lech_nhat) ? d.giai_doan_lech_nhat : null,
    thoi_luong_giay: so(d.thoi_luong_giay, 0, 60),
    ti_le_thay_tay_trai: so(d.ti_le_thay_tay_trai, 0, 1),
    ti_le_thay_tay_phai: so(d.ti_le_thay_tay_phai, 0, 1)
  };
  for (const k of ['tayTrai', 'tayPhai', 'canhTay']) {
    const v = d.bo_phan?.[k];
    ra.bo_phan[k] = DANH_GIA_PHAN.has(v) ? v : 'on';
  }
  if (!ra.tu_muc_tieu || !ra.muc_do || ra.xep_hang === null || !ra.tu_doan) return null;
  if (ra.top3.some((t) => !t.tu || t.p === null)) return null;
  return ra;
}

function lamSach(s) {
  return s.replace(/[*#_`>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 1200);
}

// Goi Gemini, tu thu lan luot cac model. Dung chung cho Meo va cho ghep cau.
async function goiGemini(env, { heThong, noiDung, cauHinh }) {
  const ds = env.GEMINI_MODEL ? [env.GEMINI_MODEL, ...DS_MODEL.filter((m) => m !== env.GEMINI_MODEL)] : DS_MODEL;
  const loiCacModel = [];
  for (const model of ds) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: heThong }] },
        contents: [{ role: 'user', parts: [{ text: noiDung }] }],
        generationConfig: cauHinh
      })
    });
    if (r.status === 404 || r.status === 400) {
      const chu = await r.text();
      // key sai thi model nao cung vay -> dung ngay, bao ro cho nguoi cai dat
      if (/API_KEY_INVALID|API key not valid/i.test(chu)) return { loi: 'GEMINI_API_KEY khong hop le', trangThai: 500 };
      let chiTiet = '';
      try {
        const e = JSON.parse(chu)?.error;
        chiTiet = [e?.status, e?.message].filter(Boolean).join(' - ').slice(0, 200);
      } catch {
        /* khong phai JSON */
      }
      // bi chan theo vi tri (may chu Cloudflare o vung Gemini khong ho tro) -> model nao cung vay
      if (/location/i.test(chiTiet)) return { loi: `Gemini HTTP ${r.status}: ${chiTiet}`, trangThai: 502 };
      loiCacModel.push(`${model}: HTTP ${r.status}${chiTiet ? ' ' + chiTiet : ''}`);
      continue; // model khong ton tai / da ngung -> thu model tiep theo
    }
    if (!r.ok) {
      // tra kem loi goc cua Google (khong chua key) de trang /kiem-tra/ biet vi sao
      let chiTiet = '';
      try {
        const e = (await r.json())?.error;
        chiTiet = [e?.status, e?.message].filter(Boolean).join(' - ').slice(0, 300);
      } catch {
        /* khong phai JSON */
      }
      return { loi: `Gemini HTTP ${r.status}${chiTiet ? ': ' + chiTiet : ''}`, trangThai: r.status === 429 ? 429 : 502 };
    }
    const j = await r.json();
    const text = (j.candidates?.[0]?.content?.parts ?? [])
      .filter((p) => typeof p.text === 'string' && !p.thought)
      .map((p) => p.text)
      .join(' ');
    if (text.trim()) return { text, model };
    loiCacModel.push(`${model}: khong co chu`);
  }
  return { loi: loiCacModel.join(' | ').slice(0, 900) || 'khong co model nao dung duoc', trangThai: 502 };
}

// =============================================================================
// Ghep cau: nguoi ky tung tu (ha tay giua cac tu) -> web gui top-3 ung vien cua moi tu
// -> Gemini chon tu hop ngu canh + dao trat tu NNKH sang tieng Viet. Chi nhan TU trong 400
// nhan va xac suat; khong nhan hinh hay toa do. Prompt giong nghien-cuu/ghep-cau/prompt.py
// (dieu kien "quy-tac+few"); quy tac theo luan an Nguyen Thi Bich Diep 2023 (Bang 3.3-3.8).
// =============================================================================
const HE_THONG_CAU = `Bạn là bộ dịch từ chuỗi ký hiệu (gloss) Ngôn ngữ Ký hiệu Việt Nam (NNKH) sang MỘT câu tiếng Việt tự nhiên.

ĐẦU VÀO: các vị trí đánh số theo ĐÚNG THỨ TỰ người ký. Mỗi vị trí có tối đa 3 ứng viên do mô hình nhận dạng đưa ra, dạng "từ xác_suất", xếp từ chắc nhất đến kém chắc nhất. Ứng viên đầu thường đúng nhưng có thể sai.

CÁCH LÀM:
- Ở mỗi vị trí chọn MỘT ứng viên sao cho cả câu hợp nghĩa nhất. Chỉ bỏ ứng viên đầu khi nó làm câu vô nghĩa và ứng viên khác có xác suất không quá thấp. Có thể bỏ hẳn một vị trí nếu mọi ứng viên đều không hợp (máy cắt nhầm một đoạn).
- Được thêm hư từ tối thiểu để câu tự nhiên (là, ở, rất, trời, cho, và…). Bỏ phần chú thích trong ngoặc: "Cao (người)" -> "cao".
- KHÔNG thêm người, vật, hành động hay ý nào không có trong ứng viên.

QUY TẮC NGỮ PHÁP (theo Nguyễn Thị Bích Điệp 2023 — luận án dịch NNKH, dữ liệu Vie-VSL10k do chuyên gia ngôn ngữ duyệt; và Hoa Nguyen 2026 về NNKH TP.HCM. Đây là xu hướng, không phải luật tuyệt đối; luôn ưu tiên nghĩa hợp lý):
1. NNKH GIẢN LƯỢC: không có ký hiệu cho giới từ, liên từ, phụ từ (đã, sẽ, đang, rất, là…), tiểu từ và từ cảm thán. Khi dịch sang tiếng Việt được thêm lại tối thiểu cho câu tự nhiên. Ví dụ: Áo | Anh | Màu xanh -> "Áo của anh màu xanh."; Tôi | Anh | Đi | Học -> "Tôi và anh đi học."
2. Câu đơn: NNKH là Chủ ngữ + Bổ ngữ + Động từ (SOV); tiếng Việt là Chủ ngữ + Động từ + Bổ ngữ (SVO). Nơi chốn, phương tiện cũng đứng trước động từ. Ví dụ: Mẹ | Phở | Nấu -> "Mẹ nấu phở."; Bố | Công ty | Làm việc -> "Bố làm việc ở công ty."
3. Phủ định: từ phủ định đứng SAU động từ và ở CUỐI câu trong NNKH; tiếng Việt đặt TRƯỚC động từ. Ví dụ: Anh | Rượu | Uống | Không nên -> "Anh không nên uống rượu."
4. Từ tình thái (muốn, cần, thích, nên) nếu được ký thường đứng sau động từ; nhưng NNKH hay lược bỏ hẳn chúng — KHÔNG tự thêm tình thái khi không có trong ứng viên. Ví dụ: Em | Công viên | Đi | Muốn -> "Em muốn đi công viên."
5. Câu hỏi: từ để hỏi luôn đứng CUỐI câu trong NNKH. Ví dụ: Táo | Ăn | Ai -> "Ai ăn táo?"; Cường | Táo | Ăn | Mấy -> "Cường ăn mấy quả táo?"
6. Số đếm đứng SAU danh từ trong NNKH: Táo | Hai -> "hai quả táo".
7. Thông tin được nhấn mạnh (thời gian, chủ đề) thường đưa lên đầu; giữ ở đầu câu tiếng Việt. Câu tính từ, câu "là", câu thời tiết giữ nguyên trật tự: Khế | Chua -> "Khế chua."; Bố | Bác sĩ -> "Bố là bác sĩ."; Mùa đông | Lạnh -> "Mùa đông trời lạnh."

VÍ DỤ:
1. Mẹ 0.82 | Con mèo 0.05 | Mập 0.03
2. Phở 0.55 | Bún 0.30 | Xôi 0.05
3. Nấu 0.41 | Nướng 0.38 | Ăn 0.10
-> {"chon": ["Mẹ", "Phở", "Nấu"], "cau": "Mẹ nấu phở."}

1. Anh 0.90 | Em 0.04 | Chị 0.02
2. Rượu 0.71 | Bia 0.20 | Nước 0.03
3. Uống 0.88 | Ăn 0.05 | Nếm 0.02
4. Không nên 0.66 | Không cần 0.21 | Nên 0.05
-> {"chon": ["Anh", "Rượu", "Uống", "Không nên"], "cau": "Anh không nên uống rượu."}

1. Bây giờ 0.93 | Buổi tối 0.03 | Giờ 0.01
2. Bố 0.77 | Chú 0.12 | Bác 0.04
3. Công ty 0.48 | Ngân hàng 0.31 | Nhà 0.08
4. Làm việc 0.85 | Học 0.06 | Viết 0.03
-> {"chon": ["Bây giờ", "Bố", "Công ty", "Làm việc"], "cau": "Bây giờ bố làm việc ở công ty."}

1. Mùa đông 0.62 | Mùa thu 0.25 | Mùa xuân 0.06
2. Lạnh 0.91 | Mát mẻ 0.04 | Ấm 0.02
-> {"chon": ["Mùa đông", "Lạnh"], "cau": "Mùa đông trời lạnh."}

1. Em 0.88 | Chị 0.05 | Cháu 0.03
2. Công viên 0.67 | Trường học 0.12 | Chợ 0.09
3. Đi 0.94 | Chạy 0.03 | Dừng lại 0.01
4. Muốn 0.52 | Thích 0.35 | Cần 0.07
-> {"chon": ["Em", "Công viên", "Đi", "Muốn"], "cau": "Em muốn đi công viên."}

ĐẦU RA: CHỈ một JSON trên một dòng, không markdown:
{"chon": ["từ đã chọn ở từng vị trí, theo thứ tự ký"], "cau": "câu tiếng Việt"}`;

function kiemCau(d) {
  if (!d || !Array.isArray(d.vi_tri) || d.vi_tri.length < 1 || d.vi_tri.length > 12) return null;
  const viTri = d.vi_tri.map((uv) =>
    Array.isArray(uv)
      ? uv.slice(0, 3).map((u) => ({ tu: typeof u?.tu === 'string' && NHAN.has(u.tu) ? u.tu : null, p: so(u?.p, 0, 1) }))
      : null
  );
  if (viTri.some((uv) => !uv || !uv.length || uv.some((u) => !u.tu || u.p === null))) return null;
  return viTri;
}

function dinhDangCau(viTri) {
  return viTri.map((uv, i) => `${i + 1}. ` + uv.map((u) => `${u.tu} ${u.p.toFixed(2)}`).join(' | ')).join('\n');
}

function docCau(text, viTri) {
  const m = String(text).match(/\{[\s\S]*\}/);
  if (!m) return null;
  let j;
  try {
    j = JSON.parse(m[0]);
  } catch {
    return null;
  }
  if (typeof j?.cau !== 'string' || !j.cau.trim()) return null;
  // chi giu tu thuc su nam trong ung vien (khong cho mo hinh "bia" nhan)
  const coTrongUngVien = new Set(viTri.flat().map((u) => u.tu));
  const chon = Array.isArray(j.chon) ? j.chon.filter((t) => typeof t === 'string' && coTrongUngVien.has(t)).slice(0, 12) : [];
  return { cau: lamSach(j.cau).slice(0, 300), chon };
}

// =============================================================================
// Gop y: web gui {"loai":"gop-y", ...} -> Worker kiem tra tung truong -> chuyen tiep
// sang Google Apps Script (ghi vao Google Sheet cua nhom). Chi nhan CHU, khong nhan hinh.
// Dia chi Apps Script + khoa nam trong Secret cua Worker, nguoi ngoai khong goi thang duoc.
// =============================================================================
const LOAI_GOP_Y = new Set(['doan-sai', 'cau-sai', 'loi-web', 'de-xuat', 'khac']);
const TRANG_GOP_Y = new Set(['', 'dich', 'ghep-cau', 'hoc', 'do-vui', 'tien-do', 'gop-y', 'khac']);
const chuoi = (x, toiDa) => (typeof x === 'string' ? x.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').trim().slice(0, toiDa) : '');
const luotGopY = new Map(); // ip -> [thoi diem...] (moi isolate mot ban, du de chan spam don gian)

function kiemGopY(d) {
  if (!d || typeof d !== 'object') return null;
  if (chuoi(d.web, 50)) return null; // o bay: nguoi that khong dien
  const noiDung = chuoi(d.noi_dung, 2000);
  if (!LOAI_GOP_Y.has(d.the_loai) || noiDung.length < 3) return null;
  const nc = d.ngu_canh && typeof d.ngu_canh === 'object' ? d.ngu_canh : {};
  const tu = (x) => (typeof x === 'string' && NHAN.has(x) ? x : null);
  return {
    the_loai: d.the_loai,
    noi_dung: noiDung,
    dung_ra: chuoi(d.dung_ra, 200),
    lien_he: chuoi(d.lien_he, 200),
    nguoi_diec: d.nguoi_diec === true,
    trang: TRANG_GOP_Y.has(nc.trang) ? nc.trang : 'khac',
    tu_doan: Array.isArray(nc.tu_doan) ? nc.tu_doan.slice(0, 12).map(tu).filter(Boolean) : [],
    cau: chuoi(nc.cau, 300),
    trinh_duyet: chuoi(d.trinh_duyet, 200)
  };
}

function quaNhieuLuot(ip, now = Date.now()) {
  const ds = (luotGopY.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  ds.push(now);
  luotGopY.set(ip, ds);
  if (luotGopY.size > 5000) luotGopY.clear();
  return ds.length > 5;
}

export default {
  async fetch(req, env) {
    const nguon = req.headers.get('Origin') || '';
    const choPhep = (env.ALLOWED_ORIGINS || '*').split(',').map((s) => s.trim()).filter(Boolean);
    const hopLe = choPhep.includes('*') || choPhep.includes(nguon);
    const cors = {
      'Access-Control-Allow-Origin': choPhep.includes('*') ? '*' : hopLe ? nguon : 'null',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin'
    };
    const tra = (obj, status = 200) =>
      new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' } });

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method === 'GET') return tra({ meo: 'Gâu! Mèo đây.', co_key: Boolean(env.GEMINI_API_KEY), co_gop_y: Boolean(env.GOP_Y_URL && env.GOP_Y_KHOA) });
    if (req.method !== 'POST') return tra({ loi: 'chi nhan POST' }, 405);
    if (!hopLe) return tra({ loi: 'nguon khong duoc phep' }, 403);
    const than = await req.text();
    if (than.length > 6000) return tra({ loi: 'du lieu qua lon' }, 413);
    let yeuCau;
    try {
      yeuCau = JSON.parse(than);
    } catch {
      yeuCau = null;
    }

    // ---- Ghep cau: day top-3 cua tung tu -> mot cau tieng Viet ----
    const canKey = () => (env.GEMINI_API_KEY ? null : tra({ loi: 'Worker chua co GEMINI_API_KEY' }, 500));

    if (yeuCau?.loai === 'cau') {
      if (canKey()) return canKey();
      const viTri = kiemCau(yeuCau);
      if (!viTri) return tra({ loi: 'day tu khong hop le' }, 400);
      const kq = await goiGemini(env, {
        heThong: HE_THONG_CAU,
        noiDung: dinhDangCau(viTri),
        cauHinh: { temperature: 0, maxOutputTokens: 1024, responseMimeType: 'application/json' }
      });
      if (kq.loi) return tra({ loi: kq.loi }, kq.trangThai);
      const cau = docCau(kq.text, viTri);
      if (!cau) return tra({ loi: 'Gemini tra loi khong dung dinh dang' }, 502);
      return tra({ ...cau, model: kq.model });
    }

    // ---- Gop y cua nguoi dung -> Google Sheet cua nhom ----
    if (yeuCau?.loai === 'gop-y') {
      if (!env.GOP_Y_URL || !env.GOP_Y_KHOA) return tra({ loi: 'Worker chua cai dat gop y (GOP_Y_URL, GOP_Y_KHOA)' }, 503);
      const g = kiemGopY(yeuCau);
      if (!g) return tra({ loi: 'gop y khong hop le' }, 400);
      if (quaNhieuLuot(req.headers.get('CF-Connecting-IP') || 'khong-ro')) return tra({ loi: 'gui qua nhieu, thu lai sau' }, 429);
      try {
        const r = await fetch(env.GOP_Y_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ khoa: env.GOP_Y_KHOA, ...g }),
          redirect: 'follow'
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.ok) return tra({ loi: `Apps Script tra loi ${r.status}${j.loi ? ': ' + j.loi : ''}` }, 502);
      } catch (e) {
        return tra({ loi: 'khong goi duoc Apps Script' }, 502);
      }
      return tra({ ok: true });
    }

    // ---- Meo nhan xet mot lan ky ----
    if (canKey()) return canKey();
    let duKien;
    try {
      duKien = kiemDuKien(yeuCau?.du_kien);
    } catch {
      duKien = null;
    }
    if (!duKien) return tra({ loi: 'du kien khong hop le' }, 400);
    const kq = await goiGemini(env, {
      heThong: HE_THONG,
      noiDung: JSON.stringify(duKien),
      cauHinh: { temperature: 0.6, maxOutputTokens: 1024 }
    });
    if (kq.loi) return tra({ loi: kq.loi }, kq.trangThai);
    return tra({ loi_meo: lamSach(kq.text), model: kq.model });
  }
};
