# AccountList Component Refactoring

## Overview
The AccountList component has been refactored to improve maintainability, readability, and organization. The large monolithic component has been split into multiple focused components and utility functions.

## Changes Made

### 1. Component Split
The original 720-line `AccountList.tsx` has been split into:

- **`AccountList.tsx`** (133 lines) - Main component handling the list logic, sorting, and drag-and-drop
- **`account/AccountRow.tsx`** - Individual account row component with edit functionality
- **`account/RankDisplay.tsx`** - Reusable component for displaying rank information
- **`account/SortableAccountRow.tsx`** - Wrapper component for drag-and-drop functionality
- **`account/AccountListControls.tsx`** - Controls for column settings and sorting
- **`account/utils/rankSorting.ts`** - Utility functions for rank sorting logic

### 2. Function Conversion
All const arrow functions have been converted to regular function declarations where it wouldn't break functionality:

**Before:**
```typescript
const handleLogin = () => { ... };
const handleEdit = () => { ... };
const getSortedAccounts = () => { ... };
```

**After:**
```typescript
function handleLogin() { ... }
function handleEdit() { ... }
function getSortedAccounts() { ... }
```

### 3. Improved Organization

#### File Structure
```
components/
├── AccountList.tsx
└── account/
    ├── index.ts
    ├── AccountRow.tsx
    ├── RankDisplay.tsx
    ├── SortableAccountRow.tsx
    ├── AccountListControls.tsx
    └── utils/
        └── rankSorting.ts
```

#### Benefits
- **Single Responsibility**: Each component has a clear, focused purpose
- **Reusability**: Components like `RankDisplay` can be used elsewhere
- **Maintainability**: Easier to find and modify specific functionality
- **Testing**: Smaller components are easier to unit test
- **Performance**: Better opportunities for React memoization

### 4. Key Components

#### AccountList
- Main orchestrator component
- Handles sorting, drag-and-drop, and data updates
- Manages empty state display

#### AccountRow
- Individual account display and editing
- Handles login, edit, save, cancel, and delete operations
- Renders column content based on enabled columns

#### RankDisplay
- Displays solo/duo and flex queue ranks
- Handles unranked and previous season data
- Provides detailed tooltips

#### AccountListControls
- Column visibility settings
- Sort mode toggle
- Popover interface for settings

#### SortableAccountRow
- Wraps AccountRow with drag-and-drop functionality
- Manages sortable state and styling

### 5. Utility Functions
- `getSoloQueueSortValue()` - Calculates sort value for solo queue ranking
- `getFlexQueueSortValue()` - Calculates sort value for flex queue ranking
- `getTierImage()` - Maps tier names to image assets

## Import Organization
The `account/index.ts` file provides a clean import interface:
```typescript
import { AccountListControls, SortableAccountRow, getSoloQueueSortValue } from "./account";
```

## Breaking Changes
None. The refactored components maintain the same public API and functionality as the original implementation.

## Future Improvements
- Add PropTypes or more specific TypeScript interfaces
- Extract more constants to a shared constants file
- Add unit tests for individual components
- Consider using React.memo for performance optimization
- Add error boundaries for better error handling
