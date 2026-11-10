// Khop 400 tu cua VSL400 voi danh sach ~4.400 video cua tu dien QIPEDC.
// Ba tang, dung o tang dau tien tim thay:
//   khop       - trung ten (khong phan biet hoa thuong, kieu bo dau "hoà"/"hòa")
//   bo-ngoac   - bo phan trong ngoac: "Cao (người)" ~ "cao"; "Miến Điện (nước ...)" ~ "Miến Điện"
//   bo-tien-to - bo "con / quả / trái / cái / màu": "Con mèo" ~ "mèo"
// Tang 2, 3 chi la ung vien; mo hinh cham va nhom duyet moi quyet dinh.
// Ten khac han (dong nghia, cach viet khac) -> nhom tu tra trong danh sach QIPEDC va
// them tay (cach 'them'), video them vao cung duoc mo hinh cham nhu cac video khac.
import { mienTuMa, type Mien } from '$lib/loi/video-mau';
import { boDau, type Tu } from '$lib/loi/tu-vung';

export type MucQipedc = { ma: string; tu: string; giai_nghia?: string };
export type CachKhop = 'khop' | 'bo-ngoac' | 'bo-tien-to' | 'them' | 'cu';
export type UngVien = {
	/** ma QIPEDC (D0001B...) hoac "cu:<i>" cho link cu cua nhom */
	ma: string;
	url: string;
	mien: Mien | null;
	tuQ: string;
	giaiNghia: string;
	cach: CachKhop;
};

export const GOC_QIPEDC = 'https://qipedc.moet.gov.vn';

// Kieu bo dau cu ("hoà") va moi ("hòa") -> cung mot khoa so sanh.
const DOI_DAU: [string, string][] = [
	['oà', 'òa'], ['oá', 'óa'], ['oả', 'ỏa'], ['oã', 'õa'], ['oạ', 'ọa'],
	['oè', 'òe'], ['oé', 'óe'], ['oẻ', 'ỏe'], ['oẽ', 'õe'], ['oẹ', 'ọe'],
	['uỳ', 'ùy'], ['uý', 'úy'], ['uỷ', 'ủy'], ['uỹ', 'ũy'], ['uỵ', 'ụy']
];

export function khoaTu(s: string): string {
	let k = s.normalize('NFC').toLowerCase().replace(/[‐-―]/g, '-').replace(/\s+/g, ' ').trim();
	for (const [cu, moi] of DOI_DAU) k = k.replaceAll(cu, moi);
	return k;
}

export function boNgoac(s: string): string {
	return s.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
}

export function trongNgoac(s: string): string | null {
	return /\(([^)]*)\)/.exec(s)?.[1]?.trim() || null;
}

const TIEN_TO = ['con ', 'quả ', 'trái ', 'cái ', 'màu '];
function boTienTo(k: string): string {
	for (const p of TIEN_TO) if (k.startsWith(p) && k.length > p.length + 1) return k.slice(p.length);
	return k;
}

export function urlVideo(mau: string, ma: string): string {
	return new URL(mau.replace('{ma}', ma), GOC_QIPEDC + '/').href;
}

export type ChiMuc = { dung: Map<string, MucQipedc[]>; ngoac: Map<string, MucQipedc[]>; tienTo: Map<string, MucQipedc[]> };

export function taoChiMuc(ds: MucQipedc[]): ChiMuc {
	const them = (m: Map<string, MucQipedc[]>, k: string, x: MucQipedc) => {
		if (!k) return;
		const a = m.get(k);
		if (a) a.push(x);
		else m.set(k, [x]);
	};
	const cm: ChiMuc = { dung: new Map(), ngoac: new Map(), tienTo: new Map() };
	for (const x of ds) {
		if (!x?.ma || !x.tu) continue;
		const k = khoaTu(x.tu);
		const kb = khoaTu(boNgoac(x.tu));
		them(cm.dung, k, x);
		them(cm.ngoac, kb, x);
		them(cm.tienTo, boTienTo(kb), x);
	}
	return cm;
}

export function khopTu(tu: Tu, cm: ChiMuc, mau: string): UngVien[] {
	const k = khoaTu(tu.tu);
	const kb = khoaTu(boNgoac(tu.tu));
	let cach: CachKhop = 'khop';
	let tim = cm.dung.get(k) ?? [];
	if (!tim.length) {
		cach = 'bo-ngoac';
		tim = cm.ngoac.get(kb) ?? [];
		// "Cao (người)": uu tien muc nao co chu "người" trong ten / giai nghia
		const goiY = trongNgoac(tu.tu);
		if (goiY && tim.length > 1) {
			const g = khoaTu(goiY);
			const diem = (x: MucQipedc) => (khoaTu(x.tu).includes(g) ? 2 : khoaTu(x.giai_nghia ?? '').includes(g) ? 1 : 0);
			tim = [...tim].sort((a, b) => diem(b) - diem(a));
		}
	}
	if (!tim.length) {
		cach = 'bo-tien-to';
		tim = cm.tienTo.get(boTienTo(kb)) ?? [];
	}
	const ra: UngVien[] = [];
	const daCo = new Set<string>();
	for (const x of tim) {
		if (daCo.has(x.ma)) continue;
		daCo.add(x.ma);
		ra.push({ ma: x.ma, url: urlVideo(mau, x.ma), mien: mienTuMa(x.ma), tuQ: x.tu, giaiNghia: x.giai_nghia ?? '', cach });
	}
	if (/workers\.dev\//.test(tu.video))
		ra.push({ ma: `cu:${tu.i}`, url: tu.video, mien: null, tuQ: tu.tu, giaiNghia: 'Video cũ của nhóm', cach: 'cu' });
	return ra;
}

/** Them cac video nhom tu chon (ma QIPEDC) vao sau ung vien tu dong; bo trung, bo ma khong co. */
export function ghepThem(uv: UngVien[], ma: string[] | undefined, theoMa: Map<string, MucQipedc>, mau: string): UngVien[] {
	if (!ma?.length) return uv;
	const co = new Set(uv.map((u) => u.ma));
	const ra = [...uv];
	for (const m of ma) {
		const x = theoMa.get(m);
		if (!x || co.has(m)) continue;
		co.add(m);
		ra.push({ ma: m, url: urlVideo(mau, m), mien: mienTuMa(m), tuQ: x.tu, giaiNghia: x.giai_nghia ?? '', cach: 'them' });
	}
	return ra;
}

// ---- tra tay trong danh sach QIPEDC ---------------------------------------------------
/** Mot tu tren QIPEDC voi moi cach ky (D0001B / D0001N / D0001T -> goc D0001). */
export type NhomQipedc = { goc: string; tu: string; giaiNghia: string; ma: string[]; khong: string; khongGN: string };

export function nhomQipedc(ds: MucQipedc[]): NhomQipedc[] {
	const theoGoc = new Map<string, NhomQipedc>();
	for (const x of ds) {
		if (!x?.ma || !x.tu) continue;
		const goc = `${x.ma.replace(/[BNT]$/, '')}|${khoaTu(x.tu)}`;
		const n = theoGoc.get(goc);
		if (n) {
			if (!n.ma.includes(x.ma)) n.ma.push(x.ma);
			if (!n.giaiNghia && x.giai_nghia) n.giaiNghia = x.giai_nghia;
		} else {
			const gn = x.giai_nghia ?? '';
			theoGoc.set(goc, { goc, tu: x.tu, giaiNghia: gn, ma: [x.ma], khong: boDau(x.tu).replace(/\s+/g, ' '), khongGN: boDau(gn) });
		}
	}
	return [...theoGoc.values()];
}

/** Tim khong can dau: trung han > bat dau bang > co chua > co trong giai nghia. */
export function timQipedc(nhom: NhomQipedc[], q: string, toiDa = 8): NhomQipedc[] {
	const k = boDau(q).replace(/\s+/g, ' ').trim();
	if (!k) return [];
	const muc = (n: NhomQipedc) =>
		n.khong === k ? 0 : n.khong.startsWith(k) ? 1 : n.khong.includes(k) ? 2 : n.khongGN.includes(k) ? 3 : -1;
	return nhom
		.map((n) => ({ n, m: muc(n) }))
		.filter((x) => x.m >= 0)
		.sort((a, b) => a.m - b.m || a.n.tu.length - b.n.tu.length || a.n.goc.localeCompare(b.n.goc))
		.slice(0, toiDa)
		.map((x) => x.n);
}
