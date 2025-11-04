# Terrafusion UI Components

A comprehensive library of React UI components for the Terrafusion platform, with special focus on offline-first experiences and conflict resolution.

## Key Features

### Conflict Resolution UI

- Visual components for displaying and resolving data conflicts
- Side-by-side and inline diff views
- User-friendly conflict resolution workflows
- Conflict badges and notifications
- Comprehensive conflict management hooks

### Component Categories

- Data display components
- Form components
- Layout components
- Navigation components
- Offline status indicators
- Modal and notification components

## Installation

```bash
npm install @terrafusion/ui-components
```

## Usage

### Conflict Resolution

```tsx
import React from 'react';
import {
  ConflictManager,
  ConflictBadge,
  ConflictResolutionModal,
} from '@terrafusion/ui-components';
import { createConflictResolutionManager } from '@terrafusion/offline-sync';

function MyApp({ conflictManager, userId }) {
  return (
    <div className="app">
      <header>
        <h1>Terrafusion App</h1>

        {/* Conflict manager with badge */}
        <ConflictManager conflictManager={conflictManager} userId={userId} autoOpenModal={false} />
      </header>

      <main>{/* Your app content */}</main>
    </div>
  );
}
```

### Using the Conflict Resolution Hook

```tsx
import React from 'react';
import {
  useConflictResolution,
  ConflictResolutionModal,
  ConflictBadge,
} from '@terrafusion/ui-components';
import { ResolutionStrategy } from '@terrafusion/offline-sync';

function ConflictHandler({ conflictManager, userId }) {
  const {
    conflicts,
    unresolvedConflicts,
    isModalOpen,
    openModal,
    closeModal,
    resolveConflict,
    hasUnresolvedConflicts,
    unresolvedCount,
  } = useConflictResolution({
    conflictManager,
    userId,
    autoOpenModal: true,
    showNotifications: true,
  });

  return (
    <>
      {/* Conflict badge */}
      <ConflictBadge count={unresolvedCount} onClick={openModal} />

      {/* Conflict resolution modal */}
      <ConflictResolutionModal
        conflicts={unresolvedConflicts}
        isOpen={isModalOpen}
        onClose={closeModal}
        userId={userId}
        onResolve={resolveConflict}
      />
    </>
  );
}
```

### Conflict Diff Component

```tsx
import React from 'react';
import { ConflictDiff } from '@terrafusion/ui-components';

function ConflictViewer({ conflict }) {
  return (
    <div className="conflict-viewer">
      <h2>Conflict Details</h2>

      {/* Show differences between local and remote */}
      <ConflictDiff
        conflict={conflict}
        diffStyle="side-by-side" // or "inline"
        wrapText={true}
        showVisualStatus={true}
      />
    </div>
  );
}
```

### Conflict Action Bar

```tsx
import React, { useState } from 'react';
import { ConflictActionBar, ResolutionStrategy } from '@terrafusion/ui-components';

function ConflictResolver({ conflict, onResolve, userId }) {
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [customValue, setCustomValue] = useState(null);

  const handleResolve = async (id, strategy, userId, customValue) => {
    setSelectedStrategy(strategy);
    await onResolve(id, strategy, userId, customValue);
  };

  return (
    <div className="conflict-resolver">
      <h2>Resolve Conflict</h2>

      <ConflictActionBar
        conflictId={conflict.id}
        userId={userId}
        onResolve={handleResolve}
        selectedStrategy={selectedStrategy}
        customValue={customValue}
        onCustomValueChange={setCustomValue}
      />
    </div>
  );
}
```

## Component Reference

### Conflict Resolution Components

#### `ConflictBadge`

A badge that shows the number of conflicts.

```tsx
<ConflictBadge
  count={5}
  max={99}
  size="medium" // "small" | "medium" | "large"
  onClick={() => handleClick()}
/>
```

#### `ConflictCard`

A card that displays information about a single conflict.

```tsx
<ConflictCard
  conflict={conflict}
  selected={isSelected}
  showFullPath={false}
  onClick={() => handleSelect(conflict.id)}
/>
```

#### `ConflictList`

A list of conflicts with filtering and sorting options.

```tsx
<ConflictList
  conflicts={conflicts}
  selectedId={selectedId}
  showResolved={false}
  onConflictSelect={handleSelect}
  onFilterChange={handleFilterChange}
/>
```

#### `ConflictDiff`

Shows differences between local and remote versions of data.

```tsx
<ConflictDiff
  conflict={conflict}
  diffStyle="side-by-side" // or "inline"
  wrapText={true}
  contextLines={3}
  showVisualStatus={true}
/>
```

#### `ConflictActionBar`

Provides action buttons for resolving conflicts.

```tsx
<ConflictActionBar
  conflictId={conflict.id}
  userId={userId}
  onResolve={handleResolve}
  selectedStrategy={selectedStrategy}
  customValue={customValue}
  onCustomValueChange={setCustomValue}
  onSkip={handleSkip}
/>
```

#### `ConflictResolutionModal`

A modal that combines conflict list, diff view, and action bar.

```tsx
<ConflictResolutionModal
  conflicts={conflicts}
  isOpen={isOpen}
  onClose={handleClose}
  userId={userId}
  onResolve={handleResolve}
  diffStyle="side-by-side"
  autoCloseWhenResolved={true}
/>
```

#### `ConflictManager`

A component that wraps the conflict resolution components.

```tsx
<ConflictManager
  conflictManager={conflictManager}
  userId={userId}
  documentId="property-123"
  autoOpenModal={true}
  silentMode={false}
/>
```

### Hooks

#### `useConflictResolution`

A hook that provides conflict resolution functionality.

```tsx
const {
  conflicts,
  unresolvedConflicts,
  isModalOpen,
  openModal,
  closeModal,
  resolveConflict,
  loading,
  hasUnresolvedConflicts,
  unresolvedCount,
} = useConflictResolution({
  conflictManager,
  userId,
  documentId,
  autoOpenModal,
  showNotifications,
});
```

## Development

### Building the library

```bash
npm run build
```

### Running Storybook

```bash
npm run storybook
```

## License

MIT
