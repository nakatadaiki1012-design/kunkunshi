import React, { useState, useEffect, useRef } from 'react';
import { KunkunshiScore, KunkunshiCell, ViewMode, DisplayTheme, TuningType } from './types/kunkunshi';
import { PRESET_SCORES } from './data/presetScores';
import { sanshinSynth } from './utils/audioSynth';
import { Header } from './components/Header';
import { PerformanceToolbar } from './components/PerformanceToolbar';
import { ScoreViewVertical } from './components/ScoreViewVertical';
import { EditPalette } from './components/EditPalette';
import { PresetSelectorModal } from './components/PresetSelectorModal';
import { AiGeneratorModal } from './components/AiGeneratorModal';
import { PrintScoreView } from './components/PrintScoreView';

const STORAGE_KEY = 'kunkunshi_current_score_v1';
const SAVED_SCORES_KEY = 'kunkunshi_saved_scores_v1';

export default function App() {
  // Current Score State
  const [currentScore, setCurrentScore] = useState<KunkunshiScore>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to load score from storage', e);
    }
    return PRESET_SCORES[0]; // Default: 安里屋ユンタ
  });

  // Saved Scores List
  const [savedScores, setSavedScores] = useState<KunkunshiScore[]>(() => {
    try {
      const stored = localStorage.getItem(SAVED_SCORES_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to load saved scores', e);
    }
    return [];
  });

  // UI Modes & Themes
  const [viewMode, setViewMode] = useState<ViewMode>('performance');
  const [theme, setTheme] = useState<DisplayTheme>('dark');
  const [zoomLevel, setZoomLevel] = useState<number>(125); // Default 125% for high legibility
  const [bpm, setBpm] = useState<number>(currentScore.tempoBpm || 84);

  // Selection state
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<KunkunshiCell | null>(null);

  // Playback & Audio
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeBeatIndex, setActiveBeatIndex] = useState<number | null>(null);
  const [isMetronomeOn, setIsMetronomeOn] = useState<boolean>(false);
  const [isAudioOn, setIsAudioOn] = useState<boolean>(true);

  // Modals
  const [isPresetModalOpen, setIsPresetModalOpen] = useState<boolean>(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);

  // Sync current score to LocalStorage automatically
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentScore));
      // Also update saved list entry if exists
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

  // Flatten cells for sequential auto-scroll playback
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
      const intervalMs = Math.round((60 / bpm) * 1000); // ms per beat

      timer = setInterval(() => {
        setActiveBeatIndex((prevIndex) => {
          const totalBeats = allFlattenedCellsRef.current.length;
          if (totalBeats === 0) return null;

          const nextIndex = prevIndex === null ? 0 : (prevIndex + 1) % totalBeats;
          const currentCellData = allFlattenedCellsRef.current[nextIndex];

          if (currentCellData) {
            // Play audio pitch preview if note is not rest
            if (isAudioOn && currentCellData.note && currentCellData.note !== '◯' && currentCellData.note !== '休') {
              sanshinSynth.playNote(currentCellData.note);
            }
            // Metronome click
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

  // Cell Selection Handler
  const handleSelectCell = (columnId: string, cellId: string, cell: KunkunshiCell) => {
    setSelectedColumnId(columnId);
    setSelectedCellId(cellId);
    setSelectedCell(cell);
  };

  // Cell Content Updates
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

    // Also update current selectedCell state
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

  // Add / Delete Column
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
      alert('これ以上列を削除できません。最低1列必要です。');
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

  // Next / Prev Cell Navigation
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

  // Fullscreen
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => console.warn(e));
    } else {
      document.exitFullscreen().catch((e) => console.warn(e));
    }
  };

  // Export JSON File
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentScore, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${currentScore.title}_kunkunshi.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON String
  const handleImportJson = (jsonString: string) => {
    const parsed = JSON.parse(jsonString);
    if (!parsed.title || !parsed.columns) {
      throw new Error('Invalid Kunkunshi structure');
    }
    setCurrentScore(parsed);
    setBpm(parsed.tempoBpm || 84);
  };

  // Delete Saved Score
  const handleDeleteSavedScore = (id: string) => {
    const updated = savedScores.filter((s) => s.id !== id);
    setSavedScores(updated);
    localStorage.setItem(SAVED_SCORES_KEY, JSON.stringify(updated));
  };

  // Create Blank Score
  const handleCreateNewScore = () => {
    const newScore: KunkunshiScore = {
      id: `score-${Date.now()}`,
      title: '新しい工工四譜面',
      subtitle: '無題',
      tuning: 'Honchoushi',
      pitchKey: '4本本調子 (C-F-C)',
      tempoBpm: 80,
      cellsPerColumn: 12,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      columns: Array.from({ length: 4 }, (_, colIdx) => ({
        id: `col-${colIdx + 1}`,
        sectionTitle: `第 ${colIdx + 1} 行`,
        cells: Array.from({ length: 12 }, (_, cellIdx) => ({
          id: `c-${colIdx + 1}-${cellIdx + 1}`,
          note: '',
        })),
      })),
    };
    setCurrentScore(newScore);
    setBpm(80);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* Top Header Navigation */}
      <Header
        currentScore={currentScore}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onOpenPresetModal={() => setIsPresetModalOpen(true)}
        onExportJson={handleExportJson}
        onToggleFullscreen={handleToggleFullscreen}
      />

      {/* Performance & Display Control Bar (Visible in Performance & Edit Modes) */}
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

      {/* Main Score Area */}
      <main className="flex-1 relative overflow-hidden pb-32">
        {viewMode === 'print' ? (
          <PrintScoreView score={currentScore} />
        ) : (
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
        )}
      </main>

      {/* Edit Mode Interactive Keyboard / Palette */}
      {viewMode === 'edit' && (
        <EditPalette
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

      {/* Presets Library Modal */}
      <PresetSelectorModal
        isOpen={isPresetModalOpen}
        onClose={() => setIsPresetModalOpen(false)}
        currentScore={currentScore}
        savedScores={savedScores}
        onSelectScore={(score) => {
          setCurrentScore(score);
          setBpm(score.tempoBpm || 84);
        }}
        onCreateNewScore={handleCreateNewScore}
        onImportJson={handleImportJson}
        onDeleteSavedScore={handleDeleteSavedScore}
      />

      {/* AI Generator Modal */}
      <AiGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onScoreGenerated={(score) => {
          setCurrentScore(score);
          setBpm(score.tempoBpm || 84);
        }}
        currentScore={currentScore}
      />
    </div>
  );
}
