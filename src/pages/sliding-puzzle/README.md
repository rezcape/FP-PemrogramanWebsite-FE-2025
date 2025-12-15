# Sliding Puzzle Game - Implementation

## 📋 Overview

Sliding puzzle game implementation for WordIT platform. Players slide tiles to complete a picture puzzle with configurable grid sizes and optional time limits.

## 🎯 Features

### Backend

- ✅ Create sliding puzzle with custom image
- ✅ Configurable grid size (3x3, 4x4, 5x5, 6x6)
- ✅ Optional time limit
- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ Public and private play modes
- ✅ File upload handling (thumbnail + puzzle image)
- ✅ Access control and authentication

### Frontend

- ✅ Interactive sliding puzzle gameplay
- ✅ Drag & slide tile mechanics
- ✅ Shuffle algorithm with solvability check
- ✅ Timer with optional time limit
- ✅ Move counter
- ✅ Pause/Resume functionality
- ✅ Preview original image
- ✅ Win detection
- ✅ Responsive design
- ✅ Create/Edit puzzle pages

## 📁 File Structure

### Backend (`/Backend/src/api/game/game-list/sliding-puzzle/`)

```
sliding-puzzle/
├── schema/
│   ├── create-sliding-puzzle.schema.ts
│   ├── update-sliding-puzzle.schema.ts
│   └── index.ts
├── sliding-puzzle.controller.ts
├── sliding-puzzle.service.ts
└── README.md
```

### Frontend (`/Frontend/src/pages/sliding-puzzle/`)

```
sliding-puzzle/
├── CreateSlidingPuzzle.tsx
├── EditSlidingPuzzle.tsx
└── PlaySlidingPuzzle.tsx
```

## 🚀 API Endpoints

### Create Puzzle

```
POST /api/game/game-type/sliding-puzzle
Content-Type: multipart/form-data

Body:
- name: string
- description: string (optional)
- thumbnail_image: file
- puzzle_image: file
- grid_size: number (3-6)
- time_limit: number (optional, in seconds)
- is_publish_immediately: boolean
```

### Get Puzzle Detail

```
GET /api/game/game-type/sliding-puzzle/:id
```

### Get Puzzle for Play (Public)

```
GET /api/game/game-type/sliding-puzzle/:id/play/public
```

### Get Puzzle for Play (Private)

```
GET /api/game/game-type/sliding-puzzle/:id/play/private
```

### Update Puzzle

```
PATCH /api/game/game-type/sliding-puzzle/:id
Content-Type: multipart/form-data
```

### Delete Puzzle

```
DELETE /api/game/game-type/sliding-puzzle/:id
```

## 🎮 How to Play

1. **Start Game**: Click "Start Game" to shuffle tiles
2. **Move Tiles**: Click on tiles adjacent to the empty space to slide them
3. **Pause**: Use pause button to temporarily stop the timer
4. **Preview**: Toggle preview to see the original image
5. **Win**: Complete the puzzle by arranging all tiles in correct order

## 🧩 Game Mechanics

### Shuffle Algorithm

- Uses Fisher-Yates shuffle for randomization
- Includes solvability check to ensure puzzle can be solved
- Automatically fixes unsolvable configurations

### Win Detection

- Checks if all tiles are in their original positions
- Automatically detects completion and shows results

### Tile Movement

- Only tiles adjacent to empty space can move
- Smooth CSS transitions for visual feedback
- Click-based interaction

## 🎨 UI Components

### Play Page

- Grid-based puzzle display
- Timer and move counter
- Control buttons (Pause, Restart, Preview, Exit)
- Win screen with statistics

### Create Page

- Image upload (thumbnail + puzzle)
- Grid size selector
- Time limit configuration
- Live preview

### Edit Page

- Update all puzzle settings
- Replace images
- Toggle publish status
- Preview current images

## 🔧 Technical Details

### Grid Sizes

- 3x3: 9 tiles (Easy)
- 4x4: 16 tiles (Medium)
- 5x5: 25 tiles (Hard)
- 6x6: 36 tiles (Expert)

### Image Handling

- Puzzle image split using CSS background-position
- Dynamic tile sizing based on grid size
- Maximum puzzle image size: 5MB
- Supported formats: PNG, JPEG

### State Management

- React hooks for local state
- Real-time timer updates
- Move tracking
- Pause/resume functionality

## 📝 Routes

```typescript
// Public routes
/sliding-puzzle/play/:id - Play puzzle (public)

// Protected routes
/create-sliding-puzzle - Create new puzzle
/sliding-puzzle/edit/:id - Edit existing puzzle
```

## 🎯 Game Template Data

```csv
id,slug,name,description,logo,is_time_limit_based,is_life_based
9fdcf0f2-9b09-4cac-b648-b349c5c07388,sliding-puzzle,"Sliding Puzzle","Slide tiles to complete the picture puzzle",images,false,false
```

## 📊 Database Schema

```typescript
interface ISlidingPuzzleJson {
  puzzle_image: string; // URL to puzzle image
  grid_size: number; // 3, 4, 5, or 6
  time_limit?: number; // Optional time limit in seconds
}
```

## 🎓 Usage Example

### Creating a Puzzle

1. Navigate to `/create-sliding-puzzle`
2. Fill in title and description
3. Upload thumbnail and puzzle image
4. Select grid size (3x3 to 6x6)
5. Optionally set time limit
6. Save as draft or publish immediately

### Playing a Puzzle

1. Navigate to `/sliding-puzzle/play/:id`
2. Click "Start Game" to begin
3. Click tiles to slide them
4. Complete the puzzle to win
5. View your time and move count

## 🐛 Known Issues

- None currently

## 🔮 Future Enhancements

- Leaderboard for fastest times
- Difficulty ratings
- Multiplayer mode
- Custom tile shapes
- Sound effects
- Hint system

## 👥 Contributors

- Arya Refman (Backend & Frontend Implementation)

## 📄 License

Part of WordIT Final Project - Pemrograman Web 2025
