/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import JSZip from 'jszip';
import { KunkunshiScore } from '../types/kunkunshi';

export async function exportAppFilesZip(score?: KunkunshiScore): Promise<Blob> {
  const zip = new JSZip();

  const currentScoreJson = score
    ? JSON.stringify(score, null, 2)
    : JSON.stringify({ note: 'Exported Kunkunshi Score' }, null, 2);

  zip.file('kunkunshi-score-export.json', currentScoreJson);
  zip.file(
    'README.md',
    `# 工工四エディタ Pro (Kunkunshi Score Editor)

このZIPには工工四エディタのスコアデータおよび構成ファイルが含まれています。

## 使い方
1. アプリのアドバンスドメニューから「JSONインポート」を選択します。
2. \`kunkunshi-score-export.json\` を選択して読み込むとスコアが復元されます。
`
  );

  return await zip.generateAsync({ type: 'blob' });
}
