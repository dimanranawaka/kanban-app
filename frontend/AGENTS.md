# Frontend Codebase Documentation

## Overview
The frontend is a Next.js application implementing a Kanban board interface. It's currently a standalone demo with no backend integration.

## Tech Stack
- **Framework**: Next.js 16.1.6 (React 19.2.3)
- **Styling**: Tailwind CSS 4 + PostCSS
- **Drag & Drop**: @dnd-kit (core, sortable, utilities)
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Utilities**: clsx (classname merging)
- **Build**: Static export configured in next.config.ts

## Project Structure

### `src/app/`
- **layout.tsx**: Root layout with global styles and metadata
- **page.tsx**: Home page serving KanbanBoard component

### `src/components/`
- **KanbanBoard.tsx**: Main board container managing columns and cards state
- **KanbanColumn.tsx**: Column component with droppable area for cards
- **KanbanCard.tsx**: Individual card component with edit/delete actions
- **KanbanCardPreview.tsx**: Draggable card preview during drag operations
- **NewCardForm.tsx**: Form to add new cards to a column

### `src/lib/`
- **kanban.ts**: Utility functions for board state management
  - `BoardState` type definition
  - Functions: create/delete/move cards, rename columns
  - Local storage integration for persistence

### `src/test/`
- **setup.ts**: Vitest configuration and test utilities
- **vitest.d.ts**: TypeScript definitions for test globals

### `tests/`
- **KanbanBoard.test.tsx**: E2E tests for board functionality

## Key Components

### KanbanBoard
State management for the board:
- Maintains columns and cards
- Handles drag-and-drop operations
- Provides card CRUD operations
- Persists to localStorage (client-side only)

### KanbanColumn
Droppable container:
- Uses @dnd-kit SortableContext
- Displays column title and cards
- Rename column functionality
- Add new card form

### KanbanCard
Draggable card element:
- Displays title and description
- Edit card modal
- Delete action
- Uses @dnd-kit's useSortable hook

### NewCardForm
Modal form for adding cards:
- Title and description inputs
- Form validation
- Submit handler

## State Management
- **Local state**: React hooks (useState, useCallback)
- **Persistence**: localStorage (key: `kanban-board-state`)
- **No backend integration**: All state is client-side demo

## Drag & Drop
- Library: @dnd-kit
- Mechanism: SortableContext for column reordering; sortable items for cards within columns
- UX: Smooth animations, visual feedback during drag

## Testing

### Unit Tests (Vitest)
- `kanban.ts`: Library function tests
- `KanbanBoard.tsx`: Component rendering and interactions

### E2E Tests (Playwright)
- `tests/KanbanBoard.test.tsx`: Full user workflows

### Running Tests
```bash
npm run test:unit         # Run unit tests
npm run test:unit:watch  # Watch mode
npm run test:e2e         # E2E tests
npm run test:all         # Both
```

## Build & Deployment

### Development
```bash
npm install
npm run dev  # Starts on http://localhost:3000
```

### Production Build (Static Export)
```bash
npm run build    # Creates .next/static
npm run start    # Serves static files
```

### Docker Integration
For MVP integration:
- `next.config.ts` already configured for `output: 'export'`
- Built files will be served by FastAPI backend
- Frontend will call backend API endpoints for persistence

## Current Limitations (To Be Fixed)
- All state stored client-side (localStorage)
- No user authentication
- No backend API integration
- No AI chat feature
- Single hardcoded board

## Future Changes (Parts 2-10)
1. Add login/logout UI
2. Integrate with backend API (`/api/boards`, `/api/cards`, etc)
3. Replace localStorage with API calls
4. Add AI chat sidebar
5. Enable AI to modify board via structured outputs
