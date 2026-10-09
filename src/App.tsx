/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { KunkunshiScore, KunkunshiCell, ViewMode, DisplayTheme, TuningType, createEmptyKunkunshiScore } from './types/kunkunshi';
import { PRESET_SCORES } from './data/presetScores';
import { sanshinSynth } from './utils/audioSynth';
import { Header } from './components/Header';
import { PerformanceToolbar } from './components/PerformanceToolbar';
import { ScoreViewVertical } from './components/ScoreViewVertical';
import { Dock } from './components/Dock';
import { VirtualSanshin } from './components/VirtualSanshin';
import { ScoreLibraryModal } from './components/ScoreLibraryModal';
import { AiGeneratorModal } from './components/AiGeneratorModal';
import { TuningModal } from './components/TuningModal';
import { NewScoreWizardModal } from './components/NewScoreWizardModal';
import { ExportModal } from './components/ExportModal';
import { HelpModal } from './components/HelpModal';
import { PrintScoreView } from './components/PrintScoreView';
import { PracticeModeOverlay } from './components/PracticeModeOverlay';

const STORAGE_KEY = 'kunkunshi_current_score_v2';
const SAVED_SCORES_KEY = 'kunkunshi_saved_scores_v2';

export default function App() {
  const [currentScore, setCurrentScore] = useState<KunkunshiScore>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to load score from storage', e);
    }
    return PRESET_SCORES[0]; // Default: 安里屋ユンタ
  });

  const [savedScores, setSavedScores] = useState<KunkunshiScore[]>(() => {
    try {
      const stored = localStorage.getItem(SAVED_SCORES_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to load saved scores', e);
    }
    return [];
  });

  const [viewMode, setViewMode] = useState<ViewMode>('performance');
  const [theme, setTheme] = useState<DisplayTheme>('dark');
  const [zoomLevel, setZoomLevel] = useState<number>(125);
  const [bpm, setBpm] = useState<number>(currentScore.tempoBpm || 84);

  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<KunkunshiCell | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeBeatIndex, setActiveBeatIndex] = useState<number | null>(null);
  const [isMetronomeOn, setIsMetronomeOn] = useState<boolean>(false);
  const [isAudioOn, setIsAudioOn] = useState<boolean>(true);
  const [showSanshinBoard, setShowSanshinBoard] = useState<boolean>(false);

  // Modals
  const [isPresetModalOpen, setIsPresetModalOpen] = useState<boolean>(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isTuningModalOpen, setIsTuningModalOpen] = useState<boolean>(false);
  const [isNewScoreModalOpen, setIsNewScoreModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [isPracticeOverlayOpen, setIsPracticeOverlayOpen] = useState<boolean>(false);

  // LocalStorage Auto-Sync
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentScore));
      setSavedScores((prev) => {
        const existingIdx = prev.findIndex((s) => s.id === currentScore.id);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = currentScore;
          localStorage.setItem(SAVED_SCORES_KEY, JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
    } catch (e) {
      console.warn('Storage sync error', e);
    }
  }, [currentScore]);

  // Flattened cells for playback
  const allFlattenedCellsRef = useRef<{ note: string; columnId: string; cellId: string }[]>([]);
  useEffect(() => {
    const list: { note: string; columnId: string; cellId: string }[] = [];
    currentScore.columns.forEach((col) => {
      col.cells.forEach((cell) => {
        list.push({ note: cell.note, columnId: col.id, cellId: cell.id });
      });
    });
    allFlattenedCellsRef.current = list;
  }, [currentScore]);

  // Auto-Scroll Playback Timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (isPlaying) {
      const intervalMs = Math.round((60 / bpm) * 1000);

      timer = setInterval(() => {
        setActiveBeatIndex((prevIndex) => {
          const totalBeats = allFlattenedCellsRef.current.length;
          if (totalBeats === 0) return null;

          const nextIndex = prevIndex === null ? 0 : (prevIndex + 1) % totalBeats;
          const currentCellData = allFlattenedCellsRef.current[nextIndex];

          if (currentCellData) {
            if (isAudioOn && currentCellData.note && currentCellData.note !== '◯' && currentCellData.note !== '休') {
              sanshinSynth.playNote(currentCellData.note);
            }
            if (isMetronomeOn) {
              sanshinSynth.playClick(nextIndex % 4 === 0);
            }
          }

          return nextIndex;
        });
      }, intervalMs);
    } else {
      if (timer) clearInterval(timer);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, bpm, isAudioOn, isMetronomeOn]);

  // Selection
  const handleSelectCell = (columnId: string, cellId: string, cell: KunkunshiCell) => {
    setSelectedColumnId(columnId);
    setSelectedCellId(cellId);
    setSelectedCell(cell);
  };

  const updateCellProperty = (
    updater: (c: KunkunshiCell) => KunkunshiCell
  ) => {
    if (!selectedColumnId || !selectedCellId) return;

    setCurrentScore((prevScore) => {
      const updatedColumns = prevScore.columns.map((col) => {
        if (col.id === selectedColumnId) {
          return {
            ...col,
            cells: col.cells.map((c) => (c.id === selectedCellId ? updater(c) : c)),
          };
        }
        return col;
      });

      return {
        ...prevScore,
        columns: updatedColumns,
        updatedAt: new Date().toISOString().split('T')[0],
      };
    });

    setSelectedCell((prev) => (prev ? updater(prev) : null));
  };

  const handleUpdateCellNote = (note: string) => {
    updateCellProperty((c) => ({ ...c, note }));
  };

  const handleUpdateCellTechnique = (technique: string) => {
    updateCellProperty((c) => ({ ...c, technique }));
  };

  const handleUpdateCellLyric = (lyric: string) => {
    updateCellProperty((c) => ({ ...c, lyric }));
  };

  const handleClearCell = () => {
    updateCellProperty((c) => ({ ...c, note: '', technique: '', lyric: '' }));
  };

  const handleAddColumn = () => {
    const newColId = `col-${Date.now()}`;
    const newCells: KunkunshiCell[] = Array.from({ length: currentScore.cellsPerColumn || 12 }, (_, i) => ({
      id: `${newColId}-c${i + 1}`,
      note: '',
    }));

    setCurrentScore((prev) => ({
      ...prev,
      columns: [
        ...prev.columns,
        {
          id: newColId,
          sectionTitle: `第 ${prev.columns.length + 1} 行`,
          cells: newCells,
        },
      ],
      updatedAt: new Date().toISOString().split('T')[0],
    }));
  };

  const handleDeleteColumn = () => {
    if (!selectedColumnId) return;
    if (currentScore.columns.length <= 1) {
      alert('これ以上列を削除できません。');
      return;
    }

    setCurrentScore((prev) => ({
      ...prev,
      columns: prev.columns.filter((col) => col.id !== selectedColumnId),
      updatedAt: new Date().toISOString().split('T')[0],
    }));

    setSelectedColumnId(null);
    setSelectedCellId(null);
    setSelectedCell(null);
  };

  const handleSelectNextCell = () => {
    if (!selectedCellId) return;
    const flatList = allFlattenedCellsRef.current;
    const currentIdx = flatList.findIndex((item) => item.cellId === selectedCellId);
    if (currentIdx >= 0 && currentIdx < flatList.length - 1) {
      const nextItem = flatList[currentIdx + 1];
      const targetCol = currentScore.columns.find((c) => c.id === nextItem.columnId);
      const targetCell = targetCol?.cells.find((c) => c.id === nextItem.cellId);
      if (targetCell) {
        handleSelectCell(nextItem.columnId, nextItem.cellId, targetCell);
      }
    }
  };

  const handleSelectPrevCell = () => {
    if (!selectedCellId) return;
    const flatList = allFlattenedCellsRef.current;
    const currentIdx = flatList.findIndex((item) => item.cellId === selectedCellId);
    if (currentIdx > 0) {
      const prevItem = flatList[currentIdx - 1];
      const targetCol = currentScore.columns.find((c) => c.id === prevItem.columnId);
      const targetCell = targetCol?.cells.find((c) => c.id === prevItem.cellId);
      if (targetCell) {
        handleSelectCell(prevItem.columnId, prevItem.cellId, targetCell);
      }
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => console.warn(e));
    } else {
      document.exitFullscreen().catch((e) => console.warn(e));
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentScore, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${currentScore.title}_kunkunshi.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (jsonString: string) => {
    const parsed = JSON.parse(jsonString);
    if (!parsed.title || !parsed.columns) {
      throw new Error('Invalid Kunkunshi structure');
    }
    setCurrentScore(parsed);
    setBpm(parsed.tempoBpm || 84);
  };

  const handleDeleteSavedScore = (id: string) => {
    const updated = savedScores.filter((s) => s.id !== id);
    setSavedScores(updated);
    localStorage.setItem(SAVED_SCORES_KEY, JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      <Header
        currentScore={currentScore}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onOpenPresetModal={() => setIsPresetModalOpen(true)}
        onOpenTuningModal={() => setIsTuningModalOpen(true)}
        onOpenNewScoreModal={() => setIsNewScoreModalOpen(true)}
        onOpenHelpModal={() => setIsHelpModalOpen(true)}
        onExportJson={() => setIsExportModalOpen(true)}
        onToggleFullscreen={handleToggleFullscreen}
        onUpdateScoreMeta={(meta) => setCurrentScore((prev) => ({ ...prev, ...meta }))}
      />

      {viewMode !== 'print' && (
        <PerformanceToolbar
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          onResetPlayback={() => {
            setIsPlaying(false);
            setActiveBeatIndex(null);
          }}
          bpm={bpm}
          onBpmChange={(newBpm) => {
            setBpm(newBpm);
            setCurrentScore((prev) => ({ ...prev, tempoBpm: newBpm }));
          }}
          isMetronomeOn={isMetronomeOn}
          onToggleMetronome={() => setIsMetronomeOn(!isMetronomeOn)}
          isAudioOn={isAudioOn}
          onToggleAudio={() => setIsAudioOn(!isAudioOn)}
          theme={theme}
          onThemeChange={setTheme}
          zoomLevel={zoomLevel}
          onZoomChange={setZoomLevel}
          currentScore={currentScore}
          onTuningChange={(tuning: TuningType) =>
            setCurrentScore((prev) => ({ ...prev, tuning }))
          }
          onPitchKeyChange={(pitchKey: string) =>
            setCurrentScore((prev) => ({ ...prev, pitchKey }))
          }
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden pb-32">
        {viewMode === 'print' ? (
          <PrintScoreView score={currentScore} />
        ) : (
          <div className="flex flex-col gap-4">
            <ScoreViewVertical
              score={currentScore}
              theme={theme}
              viewMode={viewMode}
              zoomLevel={zoomLevel}
              selectedCellId={selectedCellId}
              onSelectCell={handleSelectCell}
              activeBeatIndex={activeBeatIndex}
              onNotePlayPreview={(note) => {
                if (isAudioOn) sanshinSynth.playNote(note);
              }}
            />

            {/* Toggle Virtual Sanshin Instrument Board */}
            <div className="px-6 flex justify-center">
              <button
                onClick={() => setShowSanshinBoard(!showSanshinBoard)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow"
              >
                <span>{showSanshinBoard ? 'バーチャル三線ボードを隠す' : '🎸 バーチャル三線（勘所）を表示'}</span>
              </button>
            </div>

            {showSanshinBoard && (
              <div className="px-6 max-w-5xl mx-auto w-full">
                <VirtualSanshin
                  currentScore={currentScore}
                  onNoteSelected={handleUpdateCellNote}
                  onClose={() => setShowSanshinBoard(false)}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {viewMode === 'edit' && (
        <Dock
          selectedCell={selectedCell}
          selectedColumnId={selectedColumnId}
          onUpdateCellNote={handleUpdateCellNote}
          onUpdateCellTechnique={handleUpdateCellTechnique}
          onUpdateCellLyric={handleUpdateCellLyric}
          onClearCell={handleClearCell}
          onAddColumn={handleAddColumn}
          onDeleteColumn={handleDeleteColumn}
          onSelectNextCell={handleSelectNextCell}
          onSelectPrevCell={handleSelectPrevCell}
        />
      )}

      {/* Modals */}
      <ScoreLibraryModal
        isOpen={isPresetModalOpen}
        onClose={() => setIsPresetModalOpen(false)}
        currentScore={currentScore}
        savedScores={savedScores}
        onSelectScore={(score) => {
          setCurrentScore(score);
          setBpm(score.tempoBpm || 84);
        }}
        onCreateNewScore={() => {
          setIsNewScoreModalOpen(true);
        }}
        onImportJson={handleImportJson}
        onDeleteSavedScore={handleDeleteSavedScore}
      />

      <AiGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onScoreGenerated={(score) => {
          setCurrentScore(score);
          setBpm(score.tempoBpm || 84);
        }}
        currentScore={currentScore}
      />

      <TuningModal
        score={currentScore}
        isOpen={isTuningModalOpen}
        onClose={() => setIsTuningModalOpen(false)}
        onUpdateTuning={(tuning, pitchKey) => {
          setCurrentScore((prev) => ({ ...prev, tuning, pitchKey }));
        }}
      />

      <NewScoreWizardModal
        isOpen={isNewScoreModalOpen}
        onClose={() => setIsNewScoreModalOpen(false)}
        onCreateScore={(score) => {
          setCurrentScore(score);
          setBpm(score.tempoBpm || 84);
        }}
      />

      <ExportModal
        score={currentScore}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onImportScore={(score) => {
          setCurrentScore(score);
          setBpm(score.tempoBpm || 84);
        }}
      />

      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      {isPracticeOverlayOpen && (
        <PracticeModeOverlay
          score={currentScore}
          theme={theme}
          zoomLevel={zoomLevel}
          selectedCellId={selectedCellId}
          onSelectCell={handleSelectCell}
          activeBeatIndex={activeBeatIndex}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          onResetPlayback={() => {
            setIsPlaying(false);
            setActiveBeatIndex(null);
          }}
          bpm={bpm}
          onBpmChange={setBpm}
          onClose={() => setIsPracticeOverlayOpen(false)}
        />
      )}
    </div>
  );
}
