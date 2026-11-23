/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  KunkunshiScore,
  Beat,
  Slot,
  getPitches,
  getStringNames,
  getTuningLabel,
  KANDOKORO,
  STRING_NAMES,
  accidentalOf,
  noteName,
  midiToHz,
  LEFT_HAND_ORNS,
  RIGHT_HAND_ORNS,
  ORN_MARKS,
  ORN_LABELS
} from '../types/kunkunshi';
import { buildTimeline } from '../audio/timeline';

/**
 * 譜面を Excel ファイル（.xlsx）にする。外部の部品は使わず、ブラウザの中だけで作る。
 *
 * シート構成
 *  1. 譜面 … 工工四と同じ縦書きの形（右の列から左へ読む）。1拍＝上下2マス
 *  2. 一覧 … 1マス＝1行の表（小節・拍・長さ・勘所・弦・音名・奏法・歌詞）。並べ替えや集計に使える
 *  3. 調弦 … 3本の弦と勘所の音名・周波数
 */

// ---------- 小さな ZIP 書き出し（無圧縮） ----------

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function zipStore(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  // 1980-01-01 00:00（ZIP の日付の最小値）
  const dosTime = 0;
  const dosDate = (0 << 9) | (1 << 5) | 1;

  for (const f of files) {
    const name = enc.encode(f.name);
    const crc = crc32(f.data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // ファイル名は UTF-8
    local.setUint16(8, 0, true); // 無圧縮
    local.setUint16(10, dosTime, true);
    local.setUint16(12, dosDate, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, f.data.length, true);
    local.setUint32(22, f.data.length, true);
    local.setUint16(26, name.length, true);
    local.setUint16(28, 0, true);
    chunks.push(new Uint8Array(local.buffer), name, f.data);

    const cen = new DataView(new ArrayBuffer(46));
    cen.setUint32(0, 0x02014b50, true);
    cen.setUint16(4, 20, true);
    cen.setUint16(6, 20, true);
    cen.setUint16(8, 0x0800, true);
    cen.setUint16(10, 0, true);
    cen.setUint16(12, dosTime, true);
    cen.setUint16(14, dosDate, true);
    cen.setUint32(16, crc, true);
    cen.setUint32(20, f.data.length, true);
    cen.setUint32(24, f.data.length, true);
    cen.setUint16(28, name.length, true);
    cen.setUint32(42, offset, true);
    central.push(new Uint8Array(cen.buffer), name);

    offset += 30 + name.length + f.data.length;
  }

  const centralSize = central.reduce((n, c) => n + c.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);

  const all = [...chunks, ...central, new Uint8Array(end.buffer)];
  const out = new Uint8Array(all.reduce((n, c) => n + c.length, 0));
  let p = 0;
  for (const c of all) {
    out.set(c, p);
    p += c.length;
  }
  return out;
}

// ---------- XML の小道具 ----------

const xmlEsc = (s: string) =>
  s
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** 0 → A, 25 → Z, 26 → AA */
export function colName(i: number): string {
  let s = '';
  let n = i + 1;
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}
const ref = (col: number, row: number) => `${colName(col)}${row + 1}`;

/** 文字の一部だけ色や大きさを変えるための部品 */
interface Run {
  text: string;
  color?: string; // RRGGBB
  size?: number;
  bold?: boolean;
  font?: string;
}

type CellValue = { s?: number; text?: string; runs?: Run[]; num?: number };

class SheetBuilder {
  rows = new Map<number, Map<number, CellValue>>();
  heights = new Map<number, number>();
  merges: string[] = [];

  set(col: number, row: number, v: CellValue) {
    if (!this.rows.has(row)) this.rows.set(row, new Map());
    const r = this.rows.get(row)!;
    r.set(col, { ...(r.get(col) || {}), ...v });
  }

  xmlRows(): string {
    const rowIdx = Array.from(this.rows.keys()).sort((a, b) => a - b);
    return rowIdx
      .map(r => {
        const cells = this.rows.get(r)!;
        const ht = this.heights.get(r);
        const cols = Array.from(cells.keys()).sort((a, b) => a - b);
        const cellXml = cols
          .map(c => {
            const v = cells.get(c)!;
            const st = v.s ? ` s="${v.s}"` : '';
            if (v.num !== undefined) return `<c r="${ref(c, r)}"${st}><v>${v.num}</v></c>`;
            if (v.runs && v.runs.length) {
              const runs = v.runs
                .filter(run => run.text)
                .map(run => {
                  const pr =
                    (run.bold ? '<b/>' : '') +
                    `<sz val="${run.size ?? 11}"/>` +
                    (run.color ? `<color rgb="FF${run.color}"/>` : '') +
                    `<rFont val="${xmlEsc(run.font ?? 'Yu Mincho')}"/>`;
                  return `<r><rPr>${pr}</rPr><t xml:space="preserve">${xmlEsc(run.text)}</t></r>`;
                })
                .join('');
              return `<c r="${ref(c, r)}"${st} t="inlineStr"><is>${runs}</is></c>`;
            }
            if (v.text !== undefined && v.text !== '') {
              return `<c r="${ref(c, r)}"${st} t="inlineStr"><is><t xml:space="preserve">${xmlEsc(v.text)}</t></is></c>`;
            }
            return `<c r="${ref(c, r)}"${st}/>`;
          })
          .join('');
        return `<row r="${r + 1}"${ht ? ` ht="${ht}" customHeight="1"` : ''}>${cellXml}</row>`;
      })
      .join('');
  }
}

// ---------- 書式（styles.xml の並び順と対応） ----------

const S = {
  noteMeasureTop: 1, // 小節の頭（上に太線）
  noteBeatTop: 2, // 拍の頭（上に細線）
  noteHalf: 3, // 拍の後半（上に点線）
  closing: 4, // 列の最後を閉じる線
  measureNum: 5,
  title: 6,
  meta: 7,
  th: 8,
  td: 9,
  tdCenter: 10,
  colLabel: 11,
  sideInfo: 12
};

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="6">
<font><sz val="11"/><name val="Yu Gothic"/><family val="3"/><charset val="128"/></font>
<font><b/><sz val="16"/><name val="Yu Mincho"/><family val="1"/><charset val="128"/></font>
<font><b/><sz val="26"/><name val="Yu Mincho"/><family val="1"/><charset val="128"/></font>
<font><sz val="8"/><color rgb="FF888888"/><name val="Yu Gothic"/><family val="3"/><charset val="128"/></font>
<font><b/><sz val="11"/><name val="Yu Gothic"/><family val="3"/><charset val="128"/></font>
<font><sz val="12"/><color rgb="FF444444"/><name val="Yu Mincho"/><family val="1"/><charset val="128"/></font>
</fonts>
<fills count="3">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFF1EEE6"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="6">
<border><left/><right/><top/><bottom/><diagonal/></border>
<border><left style="thin"/><right style="thin"/><top style="medium"/><bottom/><diagonal/></border>
<border><left style="thin"/><right style="thin"/><top style="thin"/><bottom/><diagonal/></border>
<border><left style="thin"/><right style="thin"/><top style="hair"><color rgb="FFBBBBBB"/></top><bottom/><diagonal/></border>
<border><left/><right/><top style="medium"/><bottom/><diagonal/></border>
<border><left style="thin"><color rgb="FFBFBFBF"/></left><right style="thin"><color rgb="FFBFBFBF"/></right><top style="thin"><color rgb="FFBFBFBF"/></top><bottom style="thin"><color rgb="FFBFBFBF"/></bottom><diagonal/></border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="13">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" shrinkToFit="1"/></xf>
<xf numFmtId="0" fontId="1" fillId="0" borderId="2" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" shrinkToFit="1"/></xf>
<xf numFmtId="0" fontId="1" fillId="0" borderId="3" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" shrinkToFit="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="4" xfId="0" applyBorder="1"/>
<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="top"/></xf>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="top" textRotation="255"/></xf>
<xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="4" fillId="2" borderId="5" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="5" xfId="0" applyBorder="1"/>
<xf numFmtId="0" fontId="0" fillId="0" borderId="5" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>
<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="bottom"/></xf>
<xf numFmtId="0" fontId="5" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="top" textRotation="255"/></xf>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

// ---------- 譜面の文字 ----------

const RED = 'C0392B';

function leftMarks(sl: Slot): string {
  return (sl.oshi === 1 ? '♯' : sl.oshi === 2 ? '♭' : '') + LEFT_HAND_ORNS.filter(k => sl[k]).map(k => ORN_MARKS[k]).join('');
}
function rightMarks(sl: Slot): string {
  return RIGHT_HAND_ORNS.filter(k => sl[k]).map(k => ORN_MARKS[k]).join('');
}

/** 1マス分の表記（勘所の字・休符・延ばし・くり返し） */
export function slotLabel(sl: Slot, names: readonly string[], arabic: boolean): string {
  if (sl.rest) return '○';
  if (sl.repeat2) return 'く';
  if (sl.repeat1) return '〃';
  if (sl.notes.length) return sl.notes.map(n => (arabic ? String(n + 1) : names[n] ?? String(n + 1))).join(arabic ? '·' : '');
  if (sl.tie) return 'ー';
  return '';
}

function slotRuns(sl: Slot, names: readonly string[], arabic: boolean, size: number): Run[] {
  const main = slotLabel(sl, names, arabic);
  const lh = leftMarks(sl);
  const rh = rightMarks(sl);
  if (!main && !lh && !rh) return [];
  return [
    { text: lh, color: RED, bold: true, size: Math.round(size * 0.8) },
    { text: main, bold: true, size },
    { text: rh, size: Math.round(size * 0.6) }
  ];
}

/** 1拍を、上下2マス（表拍・裏拍）に振り分ける */
function beatHalves(beat: Beat): { top: number[]; bottom: number[]; triplet: boolean } {
  if (beat.subDiv === '8_16_16') return { top: [0], bottom: [1, 2], triplet: false };
  if (beat.subDiv === '16_16_8') return { top: [0, 1], bottom: [2], triplet: false };
  if (beat.div === 1) return { top: [0], bottom: [], triplet: false };
  if (beat.div === 2) return { top: [0], bottom: [1], triplet: false };
  if (beat.div === 4) return { top: [0, 1], bottom: [2, 3], triplet: false };
  return { top: [0, 1, 2], bottom: [], triplet: true };
}

function halfRuns(beat: Beat, idx: number[], names: readonly string[], arabic: boolean): Run[] {
  const size = idx.length > 1 ? 12 : 16;
  const runs: Run[] = [];
  idx.forEach((s, i) => {
    const sl = beat.slots[s];
    if (!sl) return;
    if (i > 0) runs.push({ text: ' ', size });
    runs.push(...slotRuns(sl, names, arabic, size));
  });
  return runs.some(r => r.text.trim()) ? runs : [];
}

// ---------- シート1：譜面（縦書き） ----------

function scoreSheet(score: KunkunshiScore): string {
  const sb = new SheetBuilder();
  const names = getStringNames();
  const arabic = false;
  const per = Math.max(1, score.view.perLine || 4);
  const bpm = score.beatsPerMeasure;
  const rowsPerColumn = per * bpm * 2;
  const columns = Math.ceil(score.measures.length / per);
  const top = 1; // 1行目は「1〜4」などの見出し
  const colWidths: { col: number; width: number }[] = [];

  // 右端（A列）は曲名の列、B列は空き。右から左へ読むので画面の右側に来る
  colWidths.push({ col: 0, width: 7 }, { col: 1, width: 1.5 });
  sb.set(0, 0, { s: S.meta, text: `♩=${score.tempo}  ${bpm}/4` });
  sb.set(0, top, { s: S.title, text: score.title || '無題' });
  sb.merges.push(`${ref(0, top)}:${ref(0, top + Math.min(rowsPerColumn, 24) - 1)}`);
  const side = [score.subtitle, getTuningLabel(score), score.composer].filter(Boolean).join('　');
  colWidths.push({ col: 2, width: 4 });
  sb.set(2, top, { s: S.sideInfo, text: side });
  sb.merges.push(`${ref(2, top)}:${ref(2, top + Math.min(rowsPerColumn, 24) - 1)}`);
  colWidths.push({ col: 3, width: 1.5 });

  for (let c = 0; c < columns; c++) {
    // 1段＝「小節番号の細い列」＋「音の列」
    const numCol = 4 + c * 2;
    const noteCol = numCol + 1;
    colWidths.push({ col: numCol, width: 2.6 }, { col: noteCol, width: 9 });
    const first = c * per;
    const last = Math.min(score.measures.length, first + per) - 1;
    sb.set(noteCol, 0, { s: S.colLabel, text: `${first + 1}〜${last + 1}` });

    let row = top;
    for (let m = first; m <= last; m++) {
      const measure = score.measures[m];
      measure.beats.forEach((beat, b) => {
        const { top: t, bottom: bt, triplet } = beatHalves(beat);
        const topRuns = halfRuns(beat, t, names, arabic);
        const botRuns = halfRuns(beat, bt, names, arabic);
        sb.set(noteCol, row, { s: b === 0 ? S.noteMeasureTop : S.noteBeatTop, runs: topRuns });
        sb.set(noteCol, row + 1, { s: S.noteHalf, runs: botRuns });
        if (b === 0) sb.set(numCol, row, { s: S.measureNum, text: String(m + 1) });
        else if (triplet) sb.set(numCol, row, { s: S.measureNum, text: '3' });
        if (triplet && b === 0) sb.set(numCol, row + 1, { s: S.measureNum, text: '3' });
        // 歌詞は小節番号の列の下側に小さく
        if (score.view.showLyrics && beat.lyrics) sb.set(numCol, row + 1, { s: S.measureNum, text: beat.lyrics });
        row += 2;
      });
    }
    sb.set(noteCol, row, { s: S.closing });
  }

  for (let r = top; r < top + rowsPerColumn; r++) sb.heights.set(r, 21);
  sb.heights.set(0, 18);

  const cols = colWidths
    .sort((a, b) => a.col - b.col)
    .map(w => `<col min="${w.col + 1}" max="${w.col + 1}" width="${w.width}" customWidth="1"/>`)
    .join('');
  const landscape = score.view.paper === 'landscape';

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
<sheetViews><sheetView workbookViewId="0" rightToLeft="1" showGridLines="0"/></sheetViews>
<sheetFormatPr defaultRowHeight="18"/>
<cols>${cols}</cols>
<sheetData>${sb.xmlRows()}</sheetData>
${sb.merges.length ? `<mergeCells count="${sb.merges.length}">${sb.merges.map(m => `<mergeCell ref="${m}"/>`).join('')}</mergeCells>` : ''}
<printOptions horizontalCentered="1"/>
<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>
<pageSetup paperSize="9" orientation="${landscape ? 'landscape' : 'portrait'}" fitToWidth="1" fitToHeight="0"/>
<headerFooter><oddFooter>&amp;L${xmlEsc(score.title || '')}&amp;R&amp;P / &amp;N</oddFooter></headerFooter>
</worksheet>`;
}

// ---------- シート2：一覧（1マス＝1行） ----------

function listSheet(score: KunkunshiScore): string {
  const sb = new SheetBuilder();
  const names = getStringNames();
  const pitches = getPitches(score);
  const headers = ['小節', '拍', 'マス', '位置（拍）', '長さ（拍）', '表記', '勘所（弦）', '音名', '♯・♭', '左手の奏法', '右手の奏法', '指', '歌詞'];
  const widths = [6, 5, 5, 9, 9, 10, 10, 12, 8, 16, 16, 5, 14];
  headers.forEach((h, c) => sb.set(c, 0, { s: S.th, text: h }));

  const label = (k: string) => ORN_LABELS[k]?.label ?? k;
  const { items } = buildTimeline(score);
  items.forEach((it, i) => {
    const r = i + 1;
    const own = score.measures[it.m].beats[it.b].slots[it.s];
    const beat = score.measures[it.m].beats[it.b];
    const sounding = it.slot.notes.map(n => pitches[n] + accidentalOf(it.slot));
    const vals: CellValue[] = [
      { num: it.m + 1, s: S.tdCenter },
      { num: it.b + 1, s: S.tdCenter },
      { num: it.s + 1, s: S.tdCenter },
      { num: Math.round(it.beat * 1000) / 1000, s: S.tdCenter },
      // 長さは音（または休符）のマスだけ。延ばし・空きマスは前の音の続きなので空欄
      it.sound ? { num: Math.round(it.durBeats * 1000) / 1000, s: S.tdCenter } : { s: S.tdCenter },
      { text: slotLabel(own, names, false), s: S.tdCenter },
      { text: it.slot.notes.map(n => `${names[n]}（${STRING_NAMES[KANDOKORO[n].str]}）`).join(' '), s: S.td },
      { text: sounding.map(p => noteName(p)).join(' '), s: S.td },
      { text: own.oshi === 1 ? '♯（半音上げ）' : own.oshi === 2 ? '♭（半音下げ）' : '', s: S.td },
      { text: LEFT_HAND_ORNS.filter(k => own[k]).map(label).join('・'), s: S.td },
      { text: RIGHT_HAND_ORNS.filter(k => own[k]).map(label).join('・'), s: S.td },
      own.finger ? { text: ['', '人', '中', '小'][own.finger] || String(own.finger), s: S.tdCenter } : { s: S.tdCenter },
      { text: it.s === 0 ? beat.lyrics || '' : '', s: S.td }
    ];
    vals.forEach((v, c) => sb.set(c, r, v));
  });

  const cols = widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('');
  const lastRef = ref(headers.length - 1, Math.max(1, items.length));
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="18"/>
<cols>${cols}</cols>
<sheetData>${sb.xmlRows()}</sheetData>
<autoFilter ref="A1:${lastRef}"/>
<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>
<pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/>
</worksheet>`;
}

// ---------- シート3：調弦 ----------

function tuningSheet(score: KunkunshiScore): string {
  const sb = new SheetBuilder();
  const names = getStringNames();
  const pitches = getPitches(score);
  sb.set(0, 0, { s: S.meta, text: getTuningLabel(score) });
  sb.merges.push('A1:E1');
  ['勘所', '弦', '音名', 'MIDI', '周波数（Hz）'].forEach((h, c) => sb.set(c, 1, { s: S.th, text: h }));
  pitches.forEach((p, i) => {
    const r = i + 2;
    sb.set(0, r, { s: S.tdCenter, text: names[i] });
    sb.set(1, r, { s: S.tdCenter, text: STRING_NAMES[KANDOKORO[i].str] });
    sb.set(2, r, { s: S.tdCenter, text: noteName(p) });
    sb.set(3, r, { s: S.tdCenter, num: Math.round(p * 100) / 100 });
    sb.set(4, r, { s: S.tdCenter, num: Math.round(midiToHz(p) * 10) / 10 });
  });
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetViews><sheetView workbookViewId="0"/></sheetViews>
<sheetFormatPr defaultRowHeight="18"/>
<cols><col min="1" max="5" width="13" customWidth="1"/></cols>
<sheetData>${sb.xmlRows()}</sheetData>
<mergeCells count="1"><mergeCell ref="A1:E1"/></mergeCells>
<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>
</worksheet>`;
}

// ---------- ブック全体 ----------

export function buildXlsx(score: KunkunshiScore): Uint8Array {
  const enc = new TextEncoder();
  const sheets = [
    { name: '譜面', xml: scoreSheet(score) },
    { name: '一覧', xml: listSheet(score) },
    { name: '調弦', xml: tuningSheet(score) }
  ];
  const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  const files: { name: string; data: Uint8Array }[] = [
    {
      name: '[Content_Types].xml',
      data: enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('\n')}
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`)
    },
    {
      name: '_rels/.rels',
      data: enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`)
    },
    {
      name: 'docProps/core.xml',
      data: enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<dc:title>${xmlEsc(score.title || '工工四')}</dc:title>
<dc:creator>${xmlEsc(score.composer || '工工四エディタ')}</dc:creator>
<dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>
<dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>
</cp:coreProperties>`)
    },
    {
      name: 'docProps/app.xml',
      data: enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Kunkunshi Editor</Application></Properties>`)
    },
    {
      name: 'xl/workbook.xml',
      data: enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<bookViews><workbookView/></bookViews>
<sheets>${sheets.map((sh, i) => `<sheet name="${sh.name}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets>
<definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="1" hidden="1">'一覧'!$A$1:$M$1</definedName></definedNames>
</workbook>`)
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      data: enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('\n')}
<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`)
    },
    { name: 'xl/styles.xml', data: enc.encode(STYLES_XML) },
    ...sheets.map((sh, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, data: enc.encode(sh.xml) }))
  ];
  return zipStore(files);
}

export function exportScoreToXlsx(score: KunkunshiScore): Blob {
  return new Blob([buildXlsx(score) as Uint8Array<ArrayBuffer>], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}
