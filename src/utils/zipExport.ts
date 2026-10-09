/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import JSZip from 'jszip';
import { KotoScore } from '../types/koto';

export async function exportAppFilesZip(score?: KotoScore): Promise<Blob> {
  const zip = new JSZip();

  const currentScoreJson = score
    ? JSON.stringify(score, null, 2)
    : JSON.stringify({ note: 'Exported Koto Score' }, null, 2);

  zip.file('koto-score-export.json', currentScoreJson);
  zip.file(
    'README.md',
    `# 琴譜エディタ Pro (Koto Bunkafu Editor)

このZIPには琴譜エディタのスコアデータおよび構成ファイルが含まれています。

## 使い方
1. アプリのアドバンスドメニューから「JSONインポート」を選択します。
2. \`koto-score-export.json\` を選択して読み込むとスコアが復元されます。
`
  );

  return await zip.generateAsync({ type: 'blob' });
}
