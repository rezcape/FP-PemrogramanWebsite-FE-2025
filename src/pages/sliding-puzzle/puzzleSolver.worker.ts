interface Tile {
  id: number;
  position: number;
  isEmpty: boolean;
}

// Global variables for IDA* to avoid passing them recursively
let gGridSize: number;
let gBoard: Int8Array;
let gEmptyIndex: number;

let gPath: { tileId: number; direction: string }[] = [];
self.onmessage = (e: MessageEvent) => {
  const { tiles, gridSize } = e.data;

  if (!tiles || !gridSize) {
    self.postMessage({ success: false, error: "Invalid input" });
    return;
  }

  try {
    const result = solve(tiles, gridSize);
    self.postMessage(result);
  } catch (error) {
    self.postMessage({ success: false, error: String(error) });
  }
};

function solve(tiles: Tile[], gridSize: number) {
  gGridSize = gridSize;
  const size = gridSize * gridSize;
  gBoard = new Int8Array(size);
  gPath = [];

  // Initialize board
  for (const t of tiles) {
    gBoard[t.position] = t.id;
    if (t.id === size - 1) {
      // Assuming largest ID is the empty tile
      gEmptyIndex = t.position;
    }
  }

  // Heuristics
  const initialH = calculateHeuristic(gBoard, gGridSize);

  // Safety for larger grids where optimal solution is too slow
  // For 5x5 or larger, IDA* is too slow. Use Greedy Best-First.
  if (gridSize >= 5) {
    return solveGreedy(gridSize);
  }

  // IDA* Search
  let threshold = initialH;
  const MAX_NODES = 200000; // Time limit budget roughly
  let nodesVisited = 0;

  while (true) {
    const result = search(0, threshold);

    if (result === -1) {
      // Found!
      return { success: true, found: true, path: gPath };
    }

    if (result === Infinity) {
      // No solution found (should be impossible if IsSolvable check passed in UI)
      return { success: false, error: "No solution found" };
    }

    // Check if we exhausted our search budget/depth for responsiveness
    nodesVisited += 1000; // Rough approximation logic could be added in search
    if (threshold > 80 || nodesVisited > MAX_NODES) {
      // 80 is reasonable max for 15-puzzle
      // Fallback to greedy if optimal takes too long
      return solveGreedy(gridSize);
    }

    threshold = result;
  }
}

// Returns minimum f-score exceeding threshold, or -1 if found, or Infinity if no path
function search(g: number, threshold: number): number {
  const h = calculateHeuristic(gBoard, gGridSize);
  const f = g + h;

  if (f > threshold) return f;
  if (h === 0) return -1; // Found

  let min = Infinity;

  const neighbors = getNeighbors(gEmptyIndex, gGridSize);
  // Sort neighbors by static heuristic (move ordering)?? Not needed for simple IDA*

  for (const move of neighbors) {
    // Avoid cycle: don't go back to parent immediately
    // (gPath.length > 0 && isInverse(move, gPath[gPath.length-1])) continue;
    // Simple cycle check: track previous move direction?
    // We will just skip if it reverses the last move.
    if (gPath.length > 0) {
      const last = gPath[gPath.length - 1];
      if (last.tileId === gBoard[move.to]) {
        // If the tile we are moving is the same one we just moved, implies reversal
        // Actually simpler:
        // If we move tile X Left, empty goes Right.
        // Next step, empty can go Left (moving tile X Right). This undoes it.
        // So don't move the same TILE that was just moved.
        if (last.tileId === gBoard[move.to]) continue;
      }
    }

    // Make Move
    const oldEmpty = gEmptyIndex;
    const tileId = gBoard[move.to];

    // Swap
    gBoard[oldEmpty] = tileId;
    gBoard[move.to] = gGridSize * gGridSize - 1; // Empty ID
    gEmptyIndex = move.to;

    gPath.push({ tileId, direction: move.dir });

    const temp = search(g + 1, threshold);

    if (temp === -1) return -1;
    if (temp < min) min = temp;

    // Undo Move
    gPath.pop();
    gEmptyIndex = oldEmpty;
    gBoard[oldEmpty] = gGridSize * gGridSize - 1;
    gBoard[move.to] = tileId;
  }

  return min;
}

function solveGreedy(gridSize: number) {
  // Fallback: Just find the neighbor with the lowest Heuristic (Hill Climbing)
  // This guarantees an instant response even if not optimal path.

  const neighbors = getNeighbors(gEmptyIndex, gridSize);
  let bestMove = null;
  let minH = Infinity;

  for (const move of neighbors) {
    const oldEmpty = gEmptyIndex;
    const tileId = gBoard[move.to];

    // Move
    gBoard[oldEmpty] = tileId;
    gBoard[move.to] = gGridSize * gGridSize - 1;

    const currentH = calculateHeuristic(gBoard, gridSize);

    if (currentH < minH) {
      minH = currentH;
      bestMove = { tileId, direction: move.dir };
    }

    // Undo
    gBoard[move.to] = tileId;
    gBoard[oldEmpty] = gGridSize * gGridSize - 1;
  }

  if (bestMove) {
    return { success: true, found: false, path: [bestMove] };
  }

  return { success: true, found: false, path: [] };
}

// Helper to get raw indices of neighbors of empty slot
function getNeighbors(emptyIdx: number, size: number) {
  const r = Math.floor(emptyIdx / size);
  const c = emptyIdx % size;
  const moves = [];

  // Up (Empty moves up, Tile above moves Down)
  if (r > 0) moves.push({ to: emptyIdx - size, dir: "down" });

  // Down (Empty moves down, Tile below moves Up)
  if (r < size - 1) moves.push({ to: emptyIdx + size, dir: "up" });

  // Left (Empty moves left, Tile left moves Right)
  if (c > 0) moves.push({ to: emptyIdx - 1, dir: "right" });

  // Right (Empty moves right, Tile right moves Left)
  if (c < size - 1) moves.push({ to: emptyIdx + 1, dir: "left" });

  return moves;
}

function calculateHeuristic(board: Int8Array, gridSize: number): number {
  let distance = 0;
  let conflicts = 0;
  const len = board.length;

  // Pre-computed target positions? (optimization)
  // Dynamic calc is fine for now

  for (let i = 0; i < len; i++) {
    const tileId = board[i];
    if (tileId === len - 1) continue;

    const currentR = Math.floor(i / gridSize);
    const currentC = i % gridSize;
    const targetR = Math.floor(tileId / gridSize);
    const targetC = tileId % gridSize;

    distance += Math.abs(currentR - targetR) + Math.abs(currentC - targetC);
  }

  // Linear Conflict (Rows)
  for (let r = 0; r < gridSize; r++) {
    let max = -1;
    for (let c = 0; c < gridSize; c++) {
      const tileId = board[r * gridSize + c];
      if (tileId !== len - 1 && Math.floor(tileId / gridSize) === r) {
        if (tileId > max) {
          max = tileId;
        } else {
          // Inversion found in same row
          // Only counts if the other tile is also in this row target
          // Simplified LC check
        }
      }
    }
    // Correct Linear Conflict O(k^2) per row
    const rowTiles = [];
    for (let c = 0; c < gridSize; c++) {
      const tileId = board[r * gridSize + c];
      if (tileId !== len - 1 && Math.floor(tileId / gridSize) === r) {
        rowTiles.push(tileId);
      }
    }
    for (let i = 0; i < rowTiles.length; i++) {
      for (let j = i + 1; j < rowTiles.length; j++) {
        if (rowTiles[i] > rowTiles[j]) conflicts += 2;
      }
    }
  }

  // Cols
  for (let c = 0; c < gridSize; c++) {
    const colTiles = [];
    for (let r = 0; r < gridSize; r++) {
      const tileId = board[r * gridSize + c];
      if (tileId !== len - 1 && tileId % gridSize === c) {
        colTiles.push(tileId);
      }
    }
    for (let i = 0; i < colTiles.length; i++) {
      for (let j = i + 1; j < colTiles.length; j++) {
        if (colTiles[i] > colTiles[j]) conflicts += 2;
      }
    }
  }

  return distance + conflicts;
}
