// Mot khung keypoint va cac tin hieu doc tu no.
import { SO_DIEM, TI_LE_KHUNG_HUAN_LUYEN } from './hang-so';

/** 75 diem x (x, y) = 150 so, TOA DO KHUNG HUAN LUYEN. (0, 0) = khong bat duoc. */
export type Khung = Float32Array;

export type DiemMP = { x: number; y: number; z?: number; visibility?: number };

/** Ket qua HolisticLandmarker (chi phan can dung). */
export type KetQuaHolistic = {
	poseLandmarks?: DiemMP[][];
	leftHandLandmarks?: DiemMP[][];
	rightHandLandmarks?: DiemMP[][];
};

export const VUNG = {
	than: [0, 33],
	tayTrai: [33, 54], // left_hand_landmarks = tay TRAI cua nguoi ky
	tayPhai: [54, 75],
	canhTay: [13, 23] // khuyu, co tay va 3 diem ban tay tren pose: vi tri + duong di cua tay
} as const;

const VAI_T = 11;
const VAI_P = 12;
const HONG_T = 23;
const HONG_P = 24;
const CO_TAY_T = 15;
const CO_TAY_P = 16;

/**
 * Dua toa do chuan hoa cua camera (0..1 theo rong, cao) ve khung huan luyen.
 * Camera rong hon khung huan luyen -> coi nhu dem them le tren/duoi (khong mat
 * thong tin); hep hon -> dem le trai/phai. Mo hinh bat bien voi phep tinh tien va
 * phong to deu, chi nhay voi TI LE -> day la phep sua ti le dung, khong cat hinh.
 */
export function veKhungHuanLuyen(
	x: number,
	y: number,
	rong: number,
	cao: number,
	tiLe = TI_LE_KHUNG_HUAN_LUYEN
): [number, number] {
	if (!(rong > 0 && cao > 0)) return [x, y];
	if (rong / cao >= tiLe) {
		const caoAo = rong / tiLe;
		return [x, (y * cao + (caoAo - cao) / 2) / caoAo];
	}
	const rongAo = cao * tiLe;
	return [(x * rong + (rongAo - rong) / 2) / rongAo, y];
}

function ghiVung(kp: Khung, batDau: number, diem: DiemMP[] | undefined, soDiem: number, rong: number, cao: number) {
	if (!diem || diem.length < soDiem) return false;
	for (let i = 0; i < soDiem; i++) {
		const d = diem[i];
		if (!Number.isFinite(d.x) || !Number.isFinite(d.y)) continue;
		let [x, y] = veKhungHuanLuyen(d.x, d.y, rong, cao);
		// (0, 0) la co "khong bat duoc" — mot diem that trung dung goc thi dich di chut xiu
		if (x === 0 && y === 0) x = 1e-6;
		kp[(batDau + i) * 2] = x;
		kp[(batDau + i) * 2 + 1] = y;
	}
	return true;
}

/** HolisticLandmarkerResult -> Khung (150 so). Khong lat guong. */
export function khungTuHolistic(kq: KetQuaHolistic, rong: number, cao: number): Khung {
	const kp = new Float32Array(SO_DIEM * 2);
	const coNguoi = ghiVung(kp, 0, kq.poseLandmarks?.[0], 33, rong, cao);
	if (coNguoi) {
		ghiVung(kp, 33, kq.leftHandLandmarks?.[0], 21, rong, cao);
		ghiVung(kp, 54, kq.rightHandLandmarks?.[0], 21, rong, cao);
	}
	return kp;
}

export function coDiem(kp: Khung, i: number): boolean {
	return kp[i * 2] !== 0 || kp[i * 2 + 1] !== 0;
}

export function coVung(kp: Khung, [a, b]: readonly [number, number]): boolean {
	for (let i = a; i < b; i++) if (coDiem(kp, i)) return true;
	return false;
}

export type TinHieu = {
	coNguoi: boolean;
	coTayTrai: boolean;
	coTayPhai: boolean;
	/** co tay nao dang cao hon muc giua vai - hong */
	tayNang: boolean;
	/** be ngang vai, don vi khung huan luyen (0 neu khong co nguoi) */
	beNgangVai: number;
	coTayTrai_xy: [number, number] | null;
	coTayPhai_xy: [number, number] | null;
};

/**
 * Hai vai co THAT SU nam trong hinh khong. MediaPipe luon tra du 33 diem than, ke ca
 * khi nguoi ngoi sat camera (vai, co tay nam ngoai khung -> diem doan bua, visibility
 * thap). Khong kiem thi "tay dang gio" bat lung tung.
 */
export function thayVai(kq: KetQuaHolistic): boolean {
	const p = kq.poseLandmarks?.[0];
	if (!p || p.length < 13) return false;
	return [p[VAI_T], p[VAI_P]].every(
		(d) => (d.visibility === undefined || d.visibility >= 0.5) && d.y >= 0 && d.y <= 1 && d.x >= 0 && d.x <= 1
	);
}

/**
 * Tin hieu cho may trang thai. Tat ca chuan hoa theo chinh co the nguoi ky.
 * kq (tuy chon): ket qua MediaPipe goc -> kiem them vai co nam trong hinh.
 * "Tay nang" chi tinh khi MediaPipe THAY ban tay do (21 diem), khong dua vao co tay doan.
 */
export function docTinHieu(kp: Khung, kq?: KetQuaHolistic): TinHieu {
	const coNguoi = coDiem(kp, VAI_T) && coDiem(kp, VAI_P) && (!kq || thayVai(kq));
	const coTayTrai = coVung(kp, VUNG.tayTrai);
	const coTayPhai = coVung(kp, VUNG.tayPhai);
	if (!coNguoi) {
		return { coNguoi, coTayTrai, coTayPhai, tayNang: false, beNgangVai: 0, coTayTrai_xy: null, coTayPhai_xy: null };
	}
	const vy = (kp[VAI_T * 2 + 1] + kp[VAI_P * 2 + 1]) / 2;
	const w = Math.hypot(kp[VAI_T * 2] - kp[VAI_P * 2], kp[VAI_T * 2 + 1] - kp[VAI_P * 2 + 1]);
	// "Tay nang" = co tay cao hon diem giua vai - hong. Ngoi sat laptop thi hong nam
	// ngoai khung, MediaPipe doan bua -> gioi han trong [0,4; 0,9] be ngang vai de tay
	// dat tren ban (thap hon vai khoang 1 be ngang vai) khong bi tinh la nang.
	let duoiVai = 0.75 * w;
	if (coDiem(kp, HONG_T) && coDiem(kp, HONG_P)) {
		const hy = (kp[HONG_T * 2 + 1] + kp[HONG_P * 2 + 1]) / 2;
		duoiVai = Math.min(Math.max(0.5 * (hy - vy), 0.4 * w), 0.9 * w);
	}
	const nguong = vy + duoiVai;
	const xyT: [number, number] | null = coDiem(kp, CO_TAY_T) ? [kp[CO_TAY_T * 2], kp[CO_TAY_T * 2 + 1]] : null;
	const xyP: [number, number] | null = coDiem(kp, CO_TAY_P) ? [kp[CO_TAY_P * 2], kp[CO_TAY_P * 2 + 1]] : null;
	const tayNang = (coTayTrai && xyT !== null && xyT[1] < nguong) || (coTayPhai && xyP !== null && xyP[1] < nguong);
	return { coNguoi, coTayTrai, coTayPhai, tayNang, beNgangVai: w, coTayTrai_xy: xyT, coTayPhai_xy: xyP };
}
