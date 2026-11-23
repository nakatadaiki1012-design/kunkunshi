import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSakuraScore } from '../data/presetScores';
import { createEmptyScore } from '../types/kunkunshi';
import { buildXlsx, crc32, colName, slotLabel } from './xlsxExport';

/** ZIPの中身（ファイル名と本文）を取り出す。無圧縮・CRCの一致も確認する */
function unzip(b: Uint8Array) {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const files = new Map<string, string>();
  let p = 0;
  const dec = new TextDecoder();
  while (dv.getUint32(p, true) === 0x04034b50) {
    assert.equal(dv.getUint16(p + 8, true), 0, '無圧縮');
    const crc = dv.getUint32(p + 14, true);
    const size = dv.getUint32(p + 18, true);
    const nameLen = dv.getUint16(p + 26, true);
    const name = dec.decode(b.slice(p + 30, p + 30 + nameLen));
    const data = b.slice(p + 30 + nameLen, p + 30 + nameLen + size);
    assert.equal(crc32(data), crc, `${name} のCRCが一致`);
    files.set(name, dec.decode(data));
    p += 30 + nameLen + size;
  }
  assert.equal(dv.getUint32(b.length - 22, true), 0x06054b50, '終端レコードがある');
  return files;
}

test('列名の変換（A, Z, AA）', () => {
  assert.equal(colName(0), 'A');
  assert.equal(colName(25), 'Z');
  assert.equal(colName(26), 'AA');
});

test('CRC32 の既知の値', () => {
  assert.equal(crc32(new TextEncoder().encode('123456789')), 0xcbf43926);
});

test('さくらさくらのExcel：必要なファイルと3枚のシートがある', () => {
  const files = unzip(buildXlsx(createSakuraScore()));
  for (const f of ['[Content_Types].xml', '_rels/.rels', 'xl/workbook.xml', 'xl/styles.xml', 'xl/worksheets/sheet1.xml', 'xl/worksheets/sheet2.xml', 'xl/worksheets/sheet3.xml']) {
    assert.ok(files.has(f), f);
  }
  const wb = files.get('xl/workbook.xml')!;
  assert.match(wb, /name="譜面"/);
  assert.match(wb, /name="一覧"/);
  assert.match(wb, /name="調弦"/);
  const sheet1 = files.get('xl/worksheets/sheet1.xml')!;
  assert.match(sheet1, /rightToLeft="1"/, '縦書き譜面は右から左へ読む表示');
  assert.match(sheet1, /さくらさくら/);
  assert.match(sheet1, /<t xml:space="preserve">六<\/t>/);
});

test('記号や < & を含む曲名でも壊れたXMLにならない', () => {
  const s = createEmptyScore();
  s.title = 'A&B <テスト> "引用"';
  const files = unzip(buildXlsx(s));
  const sheet1 = files.get('xl/worksheets/sheet1.xml')!;
  assert.ok(sheet1.includes('A&amp;B &lt;テスト&gt; &quot;引用&quot;'));
  assert.ok(!sheet1.includes('<テスト>'));
});

test('マスの表記：休符・延ばし・くり返し・合わせ', () => {
  const names = ['合', '乙', '老'];
  const base = { notes: [], rest: false, tie: false, oshi: 0 };
  assert.equal(slotLabel({ ...base, rest: true }, names, false), '○');
  assert.equal(slotLabel({ ...base, tie: true }, names, false), 'ー');
  assert.equal(slotLabel({ ...base, repeat2: true }, names, false), 'く');
  assert.equal(slotLabel({ ...base, notes: [0, 2] }, names, false), '合老');
});
