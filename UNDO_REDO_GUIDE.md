# Undo/Redo System Implementation

## Overview

This implementation provides a comprehensive undo/redo system for the SaifEngine 3D application using the Command Pattern. The system supports configurable history depth, command merging, keyboard shortcuts, and provides full integration with React components.

## Architecture

### Core Components

#### 1. Command Pattern (`src/utils/commands.ts`)
- **ICommand Interface**: Base interface for all commands with execute(), undo(), and optional merge capabilities
- **BaseCommand**: Abstract base class with timestamp tracking and merge logic
- **Specific Commands**: 
  - `AddModelCommand`: Add new models to the scene
  - `RemoveModelCommand`: Remove models with proper restoration
  - `UpdateTransformCommand`: Transform operations with merging support
  - `UpdateMaterialCommand`: Material property changes
  - `UpdateMetadataCommand`: Model metadata updates
  - `UpdateVertexCommand`: Vertex-level editing operations
  - `DuplicateModelCommand`: Model duplication operations
  - `CompositeCommand`: Batch operations

#### 2. Command Manager (`src/utils/commandManager.ts`)
- **CommandManager Class**: Central manager for command execution and history
- **Configuration Options**:
  - `maxHistorySize`: Maximum number of commands to keep (default: 50)
  - `enableMerging`: Allow command merging for similar operations (default: true)
  - `mergeTimeWindow`: Time window for command merging in ms (default: 500)
- **Features**:
  - Command execution with automatic history management
  - Undo/redo operations with error handling
  - Command merging for smooth interactions
  - State change notifications
  - Batch command execution

#### 3. React Integration (`src/hooks/useCommandManager.ts`)
- **useCommandManager Hook**: React hook for accessing command manager state
- **Real-time State Updates**: Automatic re-rendering on history changes
- **Command Execution Methods**: Easy-to-use methods for executing commands

#### 4. Model Command Helpers (`src/hooks/useModelCommands.ts`)
- **useModelCommands Hook**: High-level operations for model manipulation
- **Type-safe Operations**: Strongly typed model operations
- **Batch Operations**: Support for multi-model operations

## User Interface Components

### 1. UndoRedoPanel (`src/components/UndoRedo/UndoRedoPanel.tsx`)
- **Compact and Full Modes**: Flexible display options
- **History Visualization**: Interactive command history list
- **Status Information**: Current command state and descriptions
- **Clear History**: Option to reset the entire history

### 2. Keyboard Shortcuts (`src/components/UndoRedo/KeyboardShortcuts.tsx`)
- **Cross-platform Support**: Detects macOS vs Windows/Linux
- **Interactive Help**: Tooltip showing all available shortcuts
- **Categorized Display**: Organized by functionality (History, Models, Project, etc.)

## Keyboard Shortcuts

### History Operations
- **Ctrl+Z / ⌘+Z**: Undo last action
- **Ctrl+Y / ⌘+Y**: Redo last action
- **Ctrl+Shift+Z / ⌘+Shift+Z**: Alternative redo

### Model Operations
- **Delete**: Delete selected model(s)
- **Ctrl+D / ⌘+D**: Duplicate selected model(s)

### Project Operations
- **Ctrl+S / ⌘+S**: Save project
- **Ctrl+O / ⌘+O**: Open project
- **Ctrl+N / ⌘+N**: New project

### View Controls
- **G**: Toggle grid visibility
- **W**: Toggle wireframe mode
- **Escape**: Clear selection / Cancel operation

## Command Merging

The system supports intelligent command merging for smooth user interactions:

### Transform Commands
- **Time Window**: Commands within 500ms are eligible for merging
- **Same Model**: Only commands affecting the same model can merge
- **Continuous Operations**: Drag operations result in single undo action

### Vertex Commands
- **Shorter Window**: 300ms merge window for responsive vertex editing
- **Same Vertex**: Only operations on the same vertex merge
- **Position Updates**: Multiple position changes merge into single command

## Usage Examples

### Basic Command Execution
```typescript
import { useCommandManager } from '../hooks/useCommandManager';
import { AddModelCommand } from '../utils/commands';

const { executeCommand } = useCommandManager();

// Execute a command
const model = createModel();
const command = new AddModelCommand(model);
executeCommand(command);
```

### Model Operations
```typescript
import { useModelCommands } from '../hooks/useModelCommands';

const { updateTransform, duplicateModel, removeModel } = useModelCommands();

// Update model transform (automatically creates and executes command)
updateTransform(modelId, {
  position: [1, 2, 3],
  rotation: [0, Math.PI/4, 0],
  scale: [1, 1, 1]
});

// Duplicate a model
duplicateModel(modelId);

// Remove a model
removeModel(modelId);
```

### Batch Operations
```typescript
const { executeBatch } = useCommandManager();

const commands = selectedModels.map(model => 
  new RemoveModelCommand(model)
);

executeBatch(commands, 'Delete selected models');
```

### History State Access
```typescript
const { 
  canUndo, 
  canRedo, 
  undoDescription, 
  redoDescription,
  historySize 
} = useCommandManager();

// Use state for UI updates
if (canUndo) {
  console.log(`Can undo: ${undoDescription}`);
}
```

## Integration Points

### 1. Model Creation (CreateModelModal)
- Uses `AddModelCommand` for undo-able model creation
- Integrates with command manager for history tracking

### 2. Transform Operations
- All transform operations use `UpdateTransformCommand`
- Supports command merging for smooth interactions
- Real-time updates with history preservation

### 3. Sidebar Integration
- Displays `UndoRedoPanel` for history management
- Shows `KeyboardShortcutsIndicator` for help
- Integrates undo/redo buttons with current state

### 4. Keyboard Event Handling
- Global keyboard shortcuts with input field detection
- Prevents shortcuts when typing in text fields
- Cross-platform modifier key support

## Error Handling

### Command Execution Errors
- Try-catch blocks around command execution
- Error logging with detailed information
- Graceful fallback for failed operations

### State Consistency
- Automatic validation of model existence
- Safe model lookups with error warnings
- Consistent state updates across components

## Performance Considerations

### Command Merging
- Reduces history size for continuous operations
- Configurable merge time windows
- Memory-efficient command storage

### History Management
- Configurable maximum history size
- Automatic cleanup of old commands
- Efficient state change notifications

### Memory Usage
- Commands store minimal state differences
- Geometry data handled separately from command history
- Automatic cleanup on history limit

## Configuration

### Command Manager Settings
```typescript
const commandManager = new CommandManager({
  maxHistorySize: 100,        // Increase for more history
  enableMerging: true,        // Enable command merging
  mergeTimeWindow: 750,       // Longer merge window
});
```

### Keyboard Shortcuts Setup
```typescript
import { setupKeyboardShortcuts } from '../utils/commandManager';

// Initialize global keyboard shortcuts
setupKeyboardShortcuts();
```

## Testing and Debugging

### History Inspection
- `getHistory()` method for debugging
- Command descriptions for user feedback
- State validation and consistency checks

### Development Tools
- Console logging for command execution
- Error reporting for failed operations
- Performance monitoring for large histories

## Future Enhancements

### Planned Features
- **Compressed History**: Store diffs instead of full state
- **Persistent History**: Save history across sessions
- **Branch History**: Support for branching undo trees
- **Visual History**: Timeline view of operations
- **Custom Commands**: Plugin system for custom operations

### Extension Points
- Custom command types for specialized operations
- Configurable merge strategies
- Plugin system for command interceptors
- Custom keyboard shortcut registration
