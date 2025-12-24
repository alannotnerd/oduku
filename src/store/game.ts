import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import {
  type GameBoard,
  type Difficulty,
  type Board,
  generatePuzzle,
  createGameBoard,
  updateConflicts,
  isSolved,
} from '../lib/sudoku';
import { 
  getHint, 
  type HintStep,
  type CandidateLink,
} from '../lib/solver';

// Re-export for convenience
export { type Difficulty } from '../lib/sudoku';
export type { HintStep, CandidateLink } from '../lib/solver';

// Selected cell position (raw, without auto-commit logic)
const selectedCellBaseAtom = atom<[number, number] | null>(null);

// Pending cell edits tracking - stores original notes when cell was first selected
interface PendingCellEdit {
  row: number;
  col: number;
  originalNotes: Set<number>;
}
export const pendingCellEditAtom = atom<PendingCellEdit | null>(null);

// Note mode toggle (kept for compatibility, but NumberPad now always uses note-like behavior)
export const noteModeAtom = atom(false);

// Selected cell with auto-commit on change
export const selectedCellAtom = atom(
  (get) => get(selectedCellBaseAtom),
  (get, set, newValue: [number, number] | null) => {
    const pending = get(pendingCellEditAtom);
    const state = get(gameStateAtom);
    
    // Commit pending edits before changing cell
    if (pending && state.board.length > 0) {
      const cell = state.board[pending.row][pending.col];
      if (!cell.isFixed && cell.value === null) {
        const currentNotes = cell.notes;
        const originalNotes = pending.originalNotes;
        
        // Priority 1: If only 1 candidate left, always fill it as a set action
        if (currentNotes.size === 1) {
          const value = [...currentNotes][0];
          set(commitCellValueAtom, { row: pending.row, col: pending.col, value });
        } else if (currentNotes.size > 1) {
          // Priority 2: If multiple candidates, check if notes changed
          const notesChanged = currentNotes.size !== originalNotes.size ||
            [...currentNotes].some(n => !originalNotes.has(n)) ||
            [...originalNotes].some(n => !currentNotes.has(n));
          
          if (notesChanged) {
            set(commitNoteChangesAtom, { 
              row: pending.row, 
              col: pending.col, 
              originalNotes, 
              newNotes: currentNotes 
            });
          }
        }
        // If 0 candidates left, do nothing (user might undo)
      }
    }
    
    // Clear pending edit
    set(pendingCellEditAtom, null);
    
    // Set new selected cell and start tracking if it's editable
    set(selectedCellBaseAtom, newValue);
    
    if (newValue && state.board.length > 0) {
      const [row, col] = newValue;
      const cell = state.board[row][col];
      if (!cell.isFixed && cell.value === null) {
        set(pendingCellEditAtom, {
          row,
          col,
          originalNotes: new Set(cell.notes),
        });
      }
    }
  }
);

// Bottom panel mode: 'reason' | 'history'
export type PanelMode = 'reason' | 'history';
export const panelModeAtom = atom<PanelMode>('reason');

// Derived: reasoning mode is active when panel mode is 'reason'
export const reasoningModeAtom = atom((get) => get(panelModeAtom) === 'reason');

// Link drawing mode (only active when reasoning mode is on)
export const linkModeAtom = atom<'off' | 'strong' | 'weak'>('off');

// Pending link start (first candidate clicked)
export interface CandidatePosition {
  row: number;
  col: number;
  candidate: number;
}
export const pendingLinkStartAtom = atom<CandidatePosition | null>(null);

// Current hint (null when no hint is shown)
export const currentHintAtom = atom<HintStep | null>(null);

// Candidate links for visualization (strong/weak chain)
export const linksAtom = atom<CandidateLink[]>([]);

// Toggle to show/hide links overlay
export const showLinksAtom = atom(true);

// Hidden link indices (for toggling individual links)
export const hiddenLinkIndicesAtom = atom<Set<number>>(new Set<number>());

// Manual links (user-drawn, persistent until cleared)
export const manualLinksAtom = atom<CandidateLink[]>([]);

// Candidate color marks (visual highlights for reasoning)
export type CandidateColorMark = 'none' | 'red' | 'green' | 'blue' | 'yellow';

export interface CandidateMarkKey {
  row: number;
  col: number;
  candidate: number;
}

// Map of candidate position to color mark
// Key format: "row-col-candidate"
export const candidateMarksAtom = atom<Map<string, CandidateColorMark>>(new Map());

// Pending link mark - when user marks one candidate for strong/weak link
export interface PendingLinkMark {
  row: number;
  col: number;
  candidate: number;
  type: 'strong' | 'weak';
}
export const pendingLinkMarkAtom = atom<PendingLinkMark | null>(null);

// Helper to create mark key
export function markKey(row: number, col: number, candidate: number): string {
  return `${row}-${col}-${candidate}`;
}

// Set a color mark on a candidate
export const setCandidateColorMarkAtom = atom(
  null,
  (get, set, { row, col, candidate, mark }: CandidateMarkKey & { mark: CandidateColorMark }) => {
    const marks = new Map(get(candidateMarksAtom));
    const key = markKey(row, col, candidate);
    if (mark === 'none') {
      marks.delete(key);
    } else {
      marks.set(key, mark);
    }
    set(candidateMarksAtom, marks);
  }
);

// Set a link mark on a candidate (strong/weak) - creates pairs automatically
export const setCandidateLinkMarkAtom = atom(
  null,
  (get, set, { row, col, candidate, type }: CandidateMarkKey & { type: 'strong' | 'weak' }) => {
    const pending = get(pendingLinkMarkAtom);
    
    // Check if this is the same candidate as pending
    if (pending && pending.row === row && pending.col === col && pending.candidate === candidate) {
      // Clicking same candidate - clear pending
      set(pendingLinkMarkAtom, null);
      return;
    }
    
    // If we have a pending mark of the same type, create a link
    if (pending && pending.type === type) {
      const newLink: CandidateLink = {
        from: { row: pending.row, col: pending.col, candidate: pending.candidate },
        to: { row, col, candidate },
        type,
      };
      
      const manualLinks = get(manualLinksAtom);
      set(manualLinksAtom, [...manualLinks, newLink]);
      set(pendingLinkMarkAtom, null);
    } else {
      // Set as new pending (or switch type)
      set(pendingLinkMarkAtom, { row, col, candidate, type });
    }
  }
);

// Clear pending link mark
export const clearPendingLinkMarkAtom = atom(
  null,
  (_get, set) => {
    set(pendingLinkMarkAtom, null);
  }
);

// Clear all candidate color marks
export const clearCandidateMarksAtom = atom(
  null,
  (_get, set) => {
    set(candidateMarksAtom, new Map());
    set(pendingLinkMarkAtom, null);
  }
);

// Legacy alias for backward compatibility
export const setCandidateMarkAtom = setCandidateColorMarkAtom;
export type CandidateMark = CandidateColorMark | 'strong' | 'weak';

// Current difficulty
export const difficultyAtom = atomWithStorage<Difficulty>('sudoku-difficulty', 'medium');

// History Tree Node
export interface HistoryNode {
  id: string;
  board: GameBoard;
  moveCount: number;
  timestamp: number;
  description: string; // e.g., "R3C5 = 7" or "Start"
  parentId: string | null;
  childrenIds: string[];
  filledCount: number; // Number of filled cells for progress tracking
}

export interface HistoryTree {
  nodes: Record<string, HistoryNode>;
  currentNodeId: string;
  rootId: string;
}

// Game state
interface GameState {
  board: GameBoard;
  solution: Board;
  startTime: number;
  isComplete: boolean;
  moveCount: number;
  difficulty: Difficulty;
  difficultyScore: number;
  strategies: Array<{ title: string; freq: number }>;
}

const initialGameState: GameState = {
  board: [],
  solution: [],
  startTime: Date.now(),
  isComplete: false,
  moveCount: 0,
  difficulty: 'medium',
  difficultyScore: 0,
  strategies: [],
};

export const gameStateAtom = atom<GameState>(initialGameState);

// History tree atom
const initialHistoryTree: HistoryTree = {
  nodes: {},
  currentNodeId: '',
  rootId: '',
};

export const historyTreeAtom = atom<HistoryTree>(initialHistoryTree);

// Legacy history for simple undo (kept for compatibility)
interface HistoryEntry {
  board: GameBoard;
  moveCount: number;
}

export const historyAtom = atom<HistoryEntry[]>([]);

// Derived atom for timer display
export const elapsedTimeAtom = atom(0);

// Helper: Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper: Count filled cells
function countFilled(board: GameBoard): number {
  let count = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell.value !== null) count++;
    }
  }
  return count;
}

// Helper: Clone board
function cloneBoard(board: GameBoard): GameBoard {
  return board.map(r => r.map(c => ({ ...c, notes: new Set(c.notes) })));
}

// Maximum number of history nodes to keep
const MAX_HISTORY_NODES = 100;

// Helper: Get all node IDs on the path from root to a given node
function getPathToNode(nodes: Record<string, HistoryNode>, nodeId: string): Set<string> {
  const path = new Set<string>();
  let current = nodes[nodeId];
  while (current) {
    path.add(current.id);
    if (!current.parentId) break;
    current = nodes[current.parentId];
  }
  return path;
}

// Helper: Prune old history nodes to stay within limit
function pruneHistoryTree(tree: HistoryTree): HistoryTree {
  const nodeCount = Object.keys(tree.nodes).length;
  if (nodeCount <= MAX_HISTORY_NODES) {
    return tree;
  }
  
  // Get all nodes on the current path - these must be preserved
  const currentPath = getPathToNode(tree.nodes, tree.currentNodeId);
  
  // Find all leaf nodes (nodes with no children) that are not on the current path
  // These are the best candidates for pruning
  const nodesToPrune: string[] = [];
  
  // Sort all nodes by timestamp (oldest first)
  const sortedNodes = Object.values(tree.nodes)
    .filter(n => !currentPath.has(n.id) && n.id !== tree.rootId)
    .sort((a, b) => a.timestamp - b.timestamp);
  
  // Calculate how many nodes to prune
  const pruneCount = nodeCount - MAX_HISTORY_NODES + 10; // Prune 10 extra to avoid frequent pruning
  
  // Find branches to prune - prefer leaf nodes and their ancestors that are not on current path
  const visited = new Set<string>();
  for (const node of sortedNodes) {
    if (nodesToPrune.length >= pruneCount) break;
    
    // Check if this is a leaf node or all its children are already marked for pruning
    const isLeaf = node.childrenIds.length === 0 || 
                   node.childrenIds.every(id => nodesToPrune.includes(id));
    
    if (isLeaf && !visited.has(node.id) && !currentPath.has(node.id)) {
      nodesToPrune.push(node.id);
      visited.add(node.id);
    }
  }
  
  if (nodesToPrune.length === 0) {
    return tree; // Nothing safe to prune
  }
  
  // Create new nodes map without pruned nodes
  const newNodes = { ...tree.nodes };
  
  for (const id of nodesToPrune) {
    const node = newNodes[id];
    if (node && node.parentId && newNodes[node.parentId]) {
      // Remove this node from its parent's children list
      newNodes[node.parentId] = {
        ...newNodes[node.parentId],
        childrenIds: newNodes[node.parentId].childrenIds.filter(cid => cid !== id),
      };
    }
    delete newNodes[id];
  }
  
  return {
    ...tree,
    nodes: newNodes,
  };
}

// Actions
export const newGameAtom = atom(
  null,
  (get, set) => {
    const difficulty = get(difficultyAtom);
    const result = generatePuzzle(difficulty);
    const board = createGameBoard(result.puzzle);
    
    // Create root node for history tree
    const rootId = generateId();
    const rootNode: HistoryNode = {
      id: rootId,
      board: cloneBoard(board),
      moveCount: 0,
      timestamp: Date.now(),
      description: 'Start',
      parentId: null,
      childrenIds: [],
      filledCount: countFilled(board),
    };
    
    set(gameStateAtom, {
      board,
      solution: result.solution,
      startTime: Date.now(),
      isComplete: false,
      moveCount: 0,
      difficulty: result.difficulty,
      difficultyScore: result.difficultyScore,
      strategies: result.strategies,
    });
    
    set(historyTreeAtom, {
      nodes: { [rootId]: rootNode },
      currentNodeId: rootId,
      rootId,
    });
    
    set(historyAtom, []);
    set(selectedCellBaseAtom, null);
    set(pendingCellEditAtom, null);
    set(noteModeAtom, false);
  }
);

// Helper: Remove a value from notes in related cells (same row, col, box)
function eliminateFromPeers(board: GameBoard, row: number, col: number, value: number): void {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (r === row || c === col || 
          (Math.floor(r / 3) === Math.floor(row / 3) && 
           Math.floor(c / 3) === Math.floor(col / 3))) {
        board[r][c].notes.delete(value);
      }
    }
  }
}

// Helper: Auto-fill all cells that have exactly one candidate
// Returns true if any cell was filled
function autoFillNakedSingles(board: GameBoard): boolean {
  let filled = false;
  
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const cell = board[row][col];
      if (cell.value === null && !cell.isFixed && cell.notes.size === 1) {
        const value = [...cell.notes][0];
        cell.value = value;
        cell.notes = new Set();
        eliminateFromPeers(board, row, col, value);
        filled = true;
      }
    }
  }
  
  return filled;
}

export const setCellValueAtom = atom(
  null,
  (get, set, value: number | null) => {
    const selected = get(selectedCellAtom);
    if (!selected) return;

    const [row, col] = selected;
    const state = get(gameStateAtom);
    const cell = state.board[row][col];

    if (cell.isFixed || state.isComplete) return;

    const noteMode = get(noteModeAtom);
    
    // Save original state to legacy history (for simple undo)
    const history = get(historyAtom);
    set(historyAtom, [...history, { 
      board: cloneBoard(state.board), 
      moveCount: state.moveCount 
    }]);

    const newBoard = cloneBoard(state.board);
    
    // Build description for this action
    let description = '';

    if (noteMode && value !== null) {
      // Toggle note
      const notes = newBoard[row][col].notes;
      if (notes.has(value)) {
        notes.delete(value);
        description = `R${row + 1}C${col + 1} -${value}`;
      } else {
        notes.add(value);
        description = `R${row + 1}C${col + 1} +${value}`;
      }
      newBoard[row][col].notes = notes;
    } else {
      // Set value
      newBoard[row][col].value = value;
      newBoard[row][col].notes = new Set();
      description = value !== null 
        ? `R${row + 1}C${col + 1} = ${value}`
        : `R${row + 1}C${col + 1} ✕`;
      
      // Remove this value from related cells' notes
      if (value !== null) {
        eliminateFromPeers(newBoard, row, col, value);
      }
    }

    // Auto-fill cells with single candidates repeatedly
    let autoFillCount = 0;
    while (autoFillNakedSingles(newBoard)) {
      autoFillCount++;
    }
    if (autoFillCount > 0) {
      description += ` (+${autoFillCount} auto)`;
    }

    const updatedBoard = updateConflicts(newBoard);
    const isComplete = isSolved(updatedBoard);
    const newMoveCount = state.moveCount + 1;

    // Add to history tree
    const tree = get(historyTreeAtom);
    const newNodeId = generateId();
    const currentNode = tree.nodes[tree.currentNodeId];
    
    const newNode: HistoryNode = {
      id: newNodeId,
      board: cloneBoard(updatedBoard),
      moveCount: newMoveCount,
      timestamp: Date.now(),
      description,
      parentId: tree.currentNodeId,
      childrenIds: [],
      filledCount: countFilled(updatedBoard),
    };
    
    // Update parent's children
    const updatedCurrentNode = {
      ...currentNode,
      childrenIds: [...currentNode.childrenIds, newNodeId],
    };
    
    const newTree = pruneHistoryTree({
      ...tree,
      nodes: {
        ...tree.nodes,
        [tree.currentNodeId]: updatedCurrentNode,
        [newNodeId]: newNode,
      },
      currentNodeId: newNodeId,
    });
    
    set(historyTreeAtom, newTree);

    set(gameStateAtom, {
      ...state,
      board: updatedBoard,
      isComplete,
      moveCount: newMoveCount,
    });
  }
);

export const undoAtom = atom(
  null,
  (get, set) => {
    const tree = get(historyTreeAtom);
    const currentNode = tree.nodes[tree.currentNodeId];
    
    // Go to parent node if exists
    if (currentNode && currentNode.parentId) {
      const parentNode = tree.nodes[currentNode.parentId];
      if (parentNode) {
        set(historyTreeAtom, {
          ...tree,
          currentNodeId: parentNode.id,
        });
        
        const state = get(gameStateAtom);
        set(gameStateAtom, {
          ...state,
          board: cloneBoard(parentNode.board),
          moveCount: parentNode.moveCount,
          isComplete: false,
        });
        
        // Also update legacy history
        const history = get(historyAtom);
        set(historyAtom, history.slice(0, -1));
      }
    }
  }
);

// Restore to a specific history node (for tree navigation)
export const restoreToNodeAtom = atom(
  null,
  (get, set, nodeId: string) => {
    const tree = get(historyTreeAtom);
    const targetNode = tree.nodes[nodeId];
    
    if (!targetNode) return;
    
    set(historyTreeAtom, {
      ...tree,
      currentNodeId: nodeId,
    });
    
    const state = get(gameStateAtom);
    set(gameStateAtom, {
      ...state,
      board: cloneBoard(targetNode.board),
      moveCount: targetNode.moveCount,
      isComplete: isSolved(targetNode.board),
    });
    
    // Rebuild legacy history from root to this node
    const newHistory: HistoryEntry[] = [];
    let current: HistoryNode | null = targetNode;
    const path: HistoryNode[] = [];
    
    while (current && current.parentId) {
      path.unshift(current);
      current = tree.nodes[current.parentId] || null;
    }
    
    // Add all ancestors except the target to history
    for (let i = 0; i < path.length - 1; i++) {
      newHistory.push({
        board: cloneBoard(path[i].board),
        moveCount: path[i].moveCount,
      });
    }
    
    set(historyAtom, newHistory);
  }
);

export const clearCellAtom = atom(
  null,
  (_get, set) => {
    set(setCellValueAtom, null);
  }
);

// Toggle a note (candidate) in the selected cell - NO HISTORY SAVE
// History is saved when the cell is deselected via commitNoteChangesAtom
export const toggleNoteAtom = atom(
  null,
  (get, set, value: number) => {
    const selected = get(selectedCellAtom);
    if (!selected) return;

    const [row, col] = selected;
    const state = get(gameStateAtom);
    
    if (state.board.length === 0) return;
    
    const cell = state.board[row][col];
    if (cell.isFixed || cell.value !== null) return;

    const newBoard = state.board.map((r, ri) =>
      r.map((c, ci) => {
        if (ri === row && ci === col) {
          const newNotes = new Set(c.notes);
          if (newNotes.has(value)) {
            newNotes.delete(value);
          } else {
            newNotes.add(value);
          }
          return { ...c, notes: newNotes };
        }
        return c;
      })
    );

    set(gameStateAtom, {
      ...state,
      board: newBoard,
    });
  }
);

// Commit a cell value with history (used when only 1 candidate remains)
export const commitCellValueAtom = atom(
  null,
  (get, set, { row, col, value }: { row: number; col: number; value: number }) => {
    const state = get(gameStateAtom);
    if (state.board.length === 0) return;
    
    const cell = state.board[row][col];
    if (cell.isFixed) return;

    // Save original state to legacy history
    const history = get(historyAtom);
    set(historyAtom, [...history, { 
      board: cloneBoard(state.board), 
      moveCount: state.moveCount 
    }]);

    const newBoard = cloneBoard(state.board);
    newBoard[row][col].value = value;
    newBoard[row][col].notes = new Set();
    
    // Remove this value from related cells' notes
    eliminateFromPeers(newBoard, row, col, value);
    
    // Auto-fill cells with single candidates repeatedly
    let autoFillCount = 0;
    while (autoFillNakedSingles(newBoard)) {
      autoFillCount++;
    }

    const description = autoFillCount > 0 
      ? `R${row + 1}C${col + 1} = ${value} (+${autoFillCount} auto)`
      : `R${row + 1}C${col + 1} = ${value}`;

    const updatedBoard = updateConflicts(newBoard);
    const isComplete = isSolved(updatedBoard);
    const newMoveCount = state.moveCount + 1;

    // Add to history tree
    const tree = get(historyTreeAtom);
    const newNodeId = generateId();
    const currentNode = tree.nodes[tree.currentNodeId];
    
    const newNode: HistoryNode = {
      id: newNodeId,
      board: cloneBoard(updatedBoard),
      moveCount: newMoveCount,
      timestamp: Date.now(),
      description,
      parentId: tree.currentNodeId,
      childrenIds: [],
      filledCount: countFilled(updatedBoard),
    };
    
    const updatedCurrentNode = {
      ...currentNode,
      childrenIds: [...currentNode.childrenIds, newNodeId],
    };
    
    const newTree = pruneHistoryTree({
      ...tree,
      nodes: {
        ...tree.nodes,
        [tree.currentNodeId]: updatedCurrentNode,
        [newNodeId]: newNode,
      },
      currentNodeId: newNodeId,
    });
    
    set(historyTreeAtom, newTree);

    set(gameStateAtom, {
      ...state,
      board: updatedBoard,
      isComplete,
      moveCount: newMoveCount,
    });
  }
);

// Commit note changes with history (used when cell is deselected)
export const commitNoteChangesAtom = atom(
  null,
  (get, set, { row, col, originalNotes, newNotes }: { 
    row: number; 
    col: number; 
    originalNotes: Set<number>; 
    newNotes: Set<number> 
  }) => {
    const state = get(gameStateAtom);
    if (state.board.length === 0) return;
    
    // Calculate what was added and removed
    const added = [...newNotes].filter(n => !originalNotes.has(n));
    const removed = [...originalNotes].filter(n => !newNotes.has(n));
    
    if (added.length === 0 && removed.length === 0) return;
    
    // Build description
    const parts: string[] = [];
    if (added.length > 0) parts.push(`+${added.join(',')}`);
    if (removed.length > 0) parts.push(`-${removed.join(',')}`);
    const description = `R${row + 1}C${col + 1} ${parts.join(' ')}`;

    // Save original state to legacy history (but with the ORIGINAL notes, not current)
    const history = get(historyAtom);
    const originalBoard = cloneBoard(state.board);
    originalBoard[row][col].notes = new Set(originalNotes);
    set(historyAtom, [...history, { 
      board: originalBoard, 
      moveCount: state.moveCount 
    }]);

    const newMoveCount = state.moveCount + 1;

    // Add to history tree
    const tree = get(historyTreeAtom);
    const newNodeId = generateId();
    const currentNode = tree.nodes[tree.currentNodeId];
    
    const newNode: HistoryNode = {
      id: newNodeId,
      board: cloneBoard(state.board), // Current state already has new notes
      moveCount: newMoveCount,
      timestamp: Date.now(),
      description,
      parentId: tree.currentNodeId,
      childrenIds: [],
      filledCount: countFilled(state.board),
    };
    
    const updatedCurrentNode = {
      ...currentNode,
      childrenIds: [...currentNode.childrenIds, newNodeId],
    };
    
    const newTree = pruneHistoryTree({
      ...tree,
      nodes: {
        ...tree.nodes,
        [tree.currentNodeId]: updatedCurrentNode,
        [newNodeId]: newNode,
      },
      currentNodeId: newNodeId,
    });
    
    set(historyTreeAtom, newTree);

    set(gameStateAtom, {
      ...state,
      moveCount: newMoveCount,
    });
  }
);

// Show hint - finds the next logical step and displays explanation
export const showHintAtom = atom(
  null,
  (get, set) => {
    const state = get(gameStateAtom);
    if (state.isComplete || state.board.length === 0) return;

    const hint = getHint(state.board);
    set(currentHintAtom, hint);
    
    // Set links for visualization
    if (hint && hint.links) {
      set(linksAtom, hint.links);
    } else {
      set(linksAtom, []);
    }
    
    // If hint suggests a cell, select it
    if (hint && hint.affectedCells.length > 0) {
      const cell = hint.affectedCells[0];
      set(selectedCellAtom, [cell.row, cell.col]);
    }
  }
);

// Apply the current hint action
export const applyHintAtom = atom(
  null,
  (get, set) => {
    const hint = get(currentHintAtom);
    if (!hint || hint.affectedCells.length === 0) return;

    const firstCell = hint.affectedCells[0];
    
    if (firstCell.value !== undefined) {
      // Place value
      set(selectedCellAtom, [firstCell.row, firstCell.col]);
      setTimeout(() => {
        set(noteModeAtom, false);
        set(setCellValueAtom, firstCell.value!);
        set(currentHintAtom, null);
        set(linksAtom, []);
      }, 0);
    } else if (firstCell.eliminated && firstCell.eliminated.length > 0) {
      // Elimination - just select the cell for now
      set(selectedCellAtom, [firstCell.row, firstCell.col]);
      set(currentHintAtom, null);
      set(linksAtom, []);
    }
  }
);

// Close hint panel
export const closeHintAtom = atom(
  null,
  (_get, set) => {
    set(currentHintAtom, null);
    set(linksAtom, []);
  }
);

// Legacy hint - directly fill with correct value (kept for compatibility)
export const hintAtom = atom(
  null,
  (get, set) => {
    const selected = get(selectedCellAtom);
    if (!selected) return;

    const [row, col] = selected;
    const state = get(gameStateAtom);
    const cell = state.board[row][col];

    if (cell.isFixed || state.isComplete) return;

    const correctValue = state.solution[row][col];
    if (correctValue === null) return;

    // Temporarily disable note mode
    const wasNoteMode = get(noteModeAtom);
    set(noteModeAtom, false);
    set(setCellValueAtom, correctValue);
    set(noteModeAtom, wasNoteMode);
  }
);

// Toggle link mode
export const toggleLinkModeAtom = atom(
  null,
  (get, set) => {
    const current = get(linkModeAtom);
    if (current === 'off') {
      set(linkModeAtom, 'strong');
    } else if (current === 'strong') {
      set(linkModeAtom, 'weak');
    } else {
      set(linkModeAtom, 'off');
      set(pendingLinkStartAtom, null);
    }
  }
);

// Click on a candidate in link mode
export const clickCandidateAtom = atom(
  null,
  (get, set, position: CandidatePosition) => {
    const linkMode = get(linkModeAtom);
    if (linkMode === 'off') return;

    const pending = get(pendingLinkStartAtom);
    
    if (!pending) {
      // First click - set as start
      set(pendingLinkStartAtom, position);
    } else {
      // Second click - create link
      const newLink: CandidateLink = {
        from: pending,
        to: position,
        type: linkMode,
      };
      
      const manualLinks = get(manualLinksAtom);
      set(manualLinksAtom, [...manualLinks, newLink]);
      set(pendingLinkStartAtom, null);
    }
  }
);

// Clear all manual links
export const clearManualLinksAtom = atom(
  null,
  (_get, set) => {
    set(manualLinksAtom, []);
    set(pendingLinkStartAtom, null);
    set(hiddenLinkIndicesAtom, new Set<number>());
  }
);

// Toggle visibility of a specific link by index
export const toggleLinkVisibilityAtom = atom(
  null,
  (get, set, index: number) => {
    const hidden = new Set(get(hiddenLinkIndicesAtom));
    if (hidden.has(index)) {
      hidden.delete(index);
    } else {
      hidden.add(index);
    }
    set(hiddenLinkIndicesAtom, hidden);
  }
);

// Undo last manual link
export const undoManualLinkAtom = atom(
  null,
  (get, set) => {
    const manualLinks = get(manualLinksAtom);
    if (manualLinks.length > 0) {
      set(manualLinksAtom, manualLinks.slice(0, -1));
    }
  }
);

// Remove a specific link by index
export const removeLinkAtom = atom(
  null,
  (get, set, index: number) => {
    const manualLinks = get(manualLinksAtom);
    const hintLinks = get(linksAtom);
    const allLinks = [...hintLinks, ...manualLinks];
    
    if (index >= 0 && index < allLinks.length) {
      if (index < hintLinks.length) {
        // Remove from hint links
        set(linksAtom, hintLinks.filter((_, i) => i !== index));
      } else {
        // Remove from manual links
        const manualIndex = index - hintLinks.length;
        set(manualLinksAtom, manualLinks.filter((_, i) => i !== manualIndex));
      }
      
      // Also remove from hidden indices if present (and adjust indices)
      const hidden = get(hiddenLinkIndicesAtom);
      const newHidden = new Set<number>();
      for (const idx of hidden) {
        if (idx < index) {
          newHidden.add(idx);
        } else if (idx > index) {
          newHidden.add(idx - 1);
        }
        // Skip idx === index (removed)
      }
      set(hiddenLinkIndicesAtom, newHidden);
    }
  }
);

// Set panel mode (preserve links when switching)
export const setPanelModeAtom = atom(
  null,
  (get, set, mode: PanelMode) => {
    const current = get(panelModeAtom);
    // If leaving reason mode, just turn off link drawing mode (keep the links)
    if (current === 'reason' && mode !== 'reason') {
      set(linkModeAtom, 'off');
      set(pendingLinkStartAtom, null);
    }
    // Entering reason mode - auto start with strong link drawing
    if (mode === 'reason' && current !== 'reason') {
      set(linkModeAtom, 'strong');
    }
    set(panelModeAtom, mode);
  }
);

// Toggle between reason and history modes
export const toggleReasoningModeAtom = atom(
  null,
  (get, set) => {
    const current = get(panelModeAtom);
    if (current === 'reason') {
      set(setPanelModeAtom, 'history');
    } else {
      set(setPanelModeAtom, 'reason');
    }
  }
);

