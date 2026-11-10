// May trang thai tu cat doan ky hieu tu luong camera: khong can bam nut.
//
//   CHO --(tay nang VA co cu dong)--> DANG KY --> DANG CHAM --> NGHI --> CHO
//    ^                                  |
//    +----(tay ha / dung yen / mat nguoi / qua dai)--- (doan khong dat: bao ly do)
//
// Moi nguong tinh bang GIAY (hang-so.ts) nen khong phu thuoc toc do khung hinh.
import { CAT_DOAN } from './hang-so';
import type { Khung, TinHieu } from './diem';

export type PhaCatDoan = 'cho' | 'dang-ky' | 'dang-cham' | 'nghi';

export type KhungVao = {
	/** thoi diem, giay */
	t: number;
	kp: Khung;
	tinHieu: TinHieu;
};

export type LyDoKetThuc = 'ha-tay' | 'dung-yen' | 'mat-nguoi' | 'qua-dai';
export type LyDoBo = 'qua-ngan' | 'it-cu-dong';

export type SuKien =
	| { loai: 'bat-dau'; t: number }
	| { loai: 'doan'; khung: KhungVao[]; thoiLuong: number; lyDo: LyDoKetThuc }
	| { loai: 'bo'; lyDo: LyDoBo; thoiLuong: number };

type Moc = { t: number; trai: [number, number] | null; phai: [number, number] | null; w: number };

export class CatDoan {
	pha: PhaCatDoan = 'cho';
	/** toc do tay moi nhat, be-ngang-vai / giay (de hien len giao dien) */
	tocDo = 0;

	private cauHinh: typeof CAT_DOAN;
	private demTruoc: KhungVao[] = [];
	private doan: KhungVao[] = [];
	private lichSu: Moc[] = [];
	private tBatDau = 0;
	private tKichHoat = 0;
	private tDongCuoi = 0;
	private tongDong = 0;
	private tHa: number | null = null;
	private tYen: number | null = null;
	private tMat: number | null = null;
	private tNghiDen = 0;
	private tTruoc: number | null = null;

	constructor(cauHinh: Partial<typeof CAT_DOAN> = {}) {
		this.cauHinh = { ...CAT_DOAN, ...cauHinh };
	}

	datLai() {
		this.pha = 'cho';
		this.demTruoc = [];
		this.doan = [];
		this.lichSu = [];
		this.tocDo = 0;
		this.tTruoc = null;
		this.tHa = this.tYen = this.tMat = null;
	}

	/** Bao cho may biet da cham xong doan vua giao -> nghi mot chut roi cho tiep. */
	xongCham(t: number) {
		this.pha = 'nghi';
		this.tNghiDen = t + this.cauHinh.giayNghi;
	}

	/**
	 * Toc do tay = quang duong co tay trong ~0,2 giay / be ngang vai / thoi gian.
	 * Lay qua cua so 0,2 giay (khong lay giua 2 khung lien tiep) de rung nhe cua
	 * MediaPipe khong bi nham la cu dong khi camera chay nhanh.
	 */
	private tinhTocDo(k: KhungVao): number {
		const h = k.tinHieu;
		const moc: Moc = { t: k.t, trai: h.coTayTrai_xy, phai: h.coTayPhai_xy, w: h.beNgangVai };
		this.lichSu.push(moc);
		while (this.lichSu.length && this.lichSu[0].t < k.t - 0.6) this.lichSu.shift();
		if (!h.coNguoi || h.beNgangVai <= 0) return 0;
		let cu: Moc | null = null;
		for (let i = this.lichSu.length - 2; i >= 0; i--) {
			if (k.t - this.lichSu[i].t >= 0.15) {
				cu = this.lichSu[i];
				break;
			}
		}
		if (!cu || cu.w <= 0) return 0;
		const dt = k.t - cu.t;
		let d = 0;
		for (const [a, b] of [[cu.trai, moc.trai], [cu.phai, moc.phai]] as const) {
			if (a && b) d = Math.max(d, Math.hypot(b[0] - a[0], b[1] - a[1]));
		}
		return d / ((cu.w + moc.w) / 2) / dt;
	}

	capNhat(k: KhungVao): SuKien | null {
		const c = this.cauHinh;
		const v = this.tinhTocDo(k);
		this.tocDo = v;
		const dt = this.tTruoc === null ? 0 : Math.min(Math.max(k.t - this.tTruoc, 0), 0.2);
		this.tTruoc = k.t;
		const dong = v > c.tocNguong;

		if (this.pha === 'nghi' && k.t >= this.tNghiDen) this.pha = 'cho';
		if (this.pha === 'nghi' || this.pha === 'dang-cham') return null;

		if (this.pha === 'cho') {
			this.demTruoc.push(k);
			while (this.demTruoc.length && this.demTruoc[0].t < k.t - c.giayDemTruoc) this.demTruoc.shift();
			if (k.tinHieu.coNguoi && k.tinHieu.tayNang && dong) {
				this.doan = [...this.demTruoc];
				this.demTruoc = [];
				this.tBatDau = this.doan[0].t;
				this.tKichHoat = k.t;
				this.tDongCuoi = k.t;
				this.tongDong = 0;
				this.tHa = this.tYen = this.tMat = null;
				this.pha = 'dang-ky';
				return { loai: 'bat-dau', t: k.t };
			}
			return null;
		}

		// ---- dang ky -----------------------------------------------------------
		this.doan.push(k);
		if (!k.tinHieu.coNguoi) {
			// mat dau nguoi: chi dem thoi gian mat, khong tinh la dung yen hay ha tay
			if (this.tMat === null) this.tMat = k.t;
		} else {
			this.tMat = null;
			if (dong) {
				this.tDongCuoi = k.t;
				this.tongDong += dt;
				this.tYen = null;
			} else if (this.tYen === null) this.tYen = k.t;
			if (!k.tinHieu.tayNang) {
				if (this.tHa === null) this.tHa = k.t;
			} else this.tHa = null;
		}

		let lyDo: LyDoKetThuc | null = null;
		if (this.tHa !== null && k.t - this.tHa >= c.giayHa) lyDo = 'ha-tay';
		else if (this.tYen !== null && k.t - this.tYen >= c.giayYen) lyDo = 'dung-yen';
		else if (this.tMat !== null && k.t - this.tMat >= c.giayMat) lyDo = 'mat-nguoi';
		else if (k.t - this.tBatDau >= c.giayToiDa) lyDo = 'qua-dai';
		if (!lyDo) return null;

		// Cat duoi: bo phan dung yen / ha tay sau cu dong that cuoi cung, chua lai chut it.
		// Ket thuc vi ha tay thi cat ngay luc tay xuong duoi nguong (dong tac ha tay
		// khong thuoc ky hieu).
		const moc = lyDo === 'ha-tay' && this.tHa !== null ? Math.min(this.tDongCuoi, this.tHa) : this.tDongCuoi;
		const cat = moc + c.giayDuoi;
		const khung = this.doan.filter((f) => f.t <= cat);
		this.doan = [];
		const thoiLuong = khung.length ? khung[khung.length - 1].t - khung[0].t : 0;
		// "qua ngan" do tu luc kich hoat, khong tinh phan dem truoc
		const thoiLuongKy = khung.length ? khung[khung.length - 1].t - this.tKichHoat : 0;
		if (thoiLuongKy < c.giayToiThieu || khung.length < c.khungToiThieu) {
			this.pha = 'cho';
			return { loai: 'bo', lyDo: 'qua-ngan', thoiLuong };
		}
		if (this.tongDong < c.giayDong) {
			this.pha = 'cho';
			return { loai: 'bo', lyDo: 'it-cu-dong', thoiLuong };
		}
		this.pha = 'dang-cham';
		return { loai: 'doan', khung, thoiLuong, lyDo };
	}
}
