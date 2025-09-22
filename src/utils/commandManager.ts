import { ICommand } from './commands';

export interface CommandManagerConfig {
  maxHistorySize: number;
  enableMerging: boolean;
  mergeTimeWindow: number; // milliseconds
}

export interface CommandManagerState {
  canUndo: boolean;
  canRedo: boolean;
  undoDescription?: string;
  redoDescription?: string;
  historySize: number;
  currentIndex: number;
}

/**
 * CommandManager handles the undo/redo history using the Command Pattern
 */
export class CommandManager {
  private history: ICommand[] = [];
  private currentIndex: number = -1;
  private config: CommandManagerConfig;
  private listeners: Array<(state: CommandManagerState) => void> = [];

  constructor(config: Partial<CommandManagerConfig> = {}) {
    this.config = {
      maxHistorySize: 50,
      enableMerging: true,
      mergeTimeWindow: 500,
      ...config
    };
  }

  /**
   * Execute a command and add it to history
   */
  executeCommand(command: ICommand): void {
    try {
      // Check if we can merge with the last command
      if (this.config.enableMerging && this.history.length > 0 && this.currentIndex >= 0) {
        const lastCommand = this.history[this.currentIndex];
        if (lastCommand.canMerge && lastCommand.canMerge(command)) {
          // Merge the commands
          const mergedCommand = lastCommand.merge!(command);
          this.history[this.currentIndex] = mergedCommand;
          
          // Execute only the new command since the last one was already executed
          command.execute();
          this.notifyListeners();
          return;
        }
      }

      // Execute the command
      command.execute();

      // Remove any commands after current index (happens when we undo then execute new command)
      this.history = this.history.slice(0, this.currentIndex + 1);

      // Add the new command
      this.history.push(command);
      this.currentIndex++;

      // Ensure we don't exceed max history size
      if (this.history.length > this.config.maxHistorySize) {
        this.history = this.history.slice(-this.config.maxHistorySize);
        this.currentIndex = this.history.length - 1;
      }

      this.notifyListeners();
    } catch (error) {
      console.error('Failed to execute command:', error);
      throw error;
    }
  }

  /**
   * Undo the last command
   */
  undo(): boolean {
    if (!this.canUndo()) {
      return false;
    }

    try {
      const command = this.history[this.currentIndex];
      command.undo();
      this.currentIndex--;
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Failed to undo command:', error);
      return false;
    }
  }

  /**
   * Redo the next command
   */
  redo(): boolean {
    if (!this.canRedo()) {
      return false;
    }

    try {
      this.currentIndex++;
      const command = this.history[this.currentIndex];
      command.execute();
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Failed to redo command:', error);
      this.currentIndex--; // Revert the index change
      return false;
    }
  }

  /**
   * Check if undo is possible
   */
  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  /**
   * Check if redo is possible
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Get the current state for UI updates
   */
  getState(): CommandManagerState {
    return {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      undoDescription: this.canUndo() ? this.history[this.currentIndex].getDescription() : undefined,
      redoDescription: this.canRedo() ? this.history[this.currentIndex + 1].getDescription() : undefined,
      historySize: this.history.length,
      currentIndex: this.currentIndex
    };
  }

  /**
   * Clear the entire history
   */
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
    this.notifyListeners();
  }

  /**
   * Get a copy of the command history for debugging
   */
  getHistory(): ICommand[] {
    return [...this.history];
  }

  /**
   * Get the command at a specific index
   */
  getCommandAt(index: number): ICommand | undefined {
    return this.history[index];
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: CommandManagerState) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<CommandManagerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Trim history if max size changed
    if (this.history.length > this.config.maxHistorySize) {
      const excess = this.history.length - this.config.maxHistorySize;
      this.history = this.history.slice(excess);
      this.currentIndex = Math.max(-1, this.currentIndex - excess);
      this.notifyListeners();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): CommandManagerConfig {
    return { ...this.config };
  }

  /**
   * Execute multiple commands as a batch
   */
  executeBatch(commands: ICommand[], description: string = 'Batch operation'): void {
    if (commands.length === 0) return;
    
    if (commands.length === 1) {
      this.executeCommand(commands[0]);
      return;
    }

    // Create a composite command
    const compositeCommand = new CompositeCommand(commands, description);
    this.executeCommand(compositeCommand);
  }

  /**
   * Notify all listeners about state changes
   */
  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in command manager listener:', error);
      }
    });
  }
}

/**
 * Composite command implementation for batching operations
 */
class CompositeCommand implements ICommand {
  private commands: ICommand[];
  private description: string;

  constructor(commands: ICommand[], description: string) {
    this.commands = [...commands];
    this.description = description;
  }

  execute(): void {
    this.commands.forEach(command => command.execute());
  }

  undo(): void {
    // Undo in reverse order
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo();
    }
  }

  getDescription(): string {
    return this.description;
  }

  canMerge(): boolean {
    return false; // Composite commands cannot be merged
  }

  merge(): ICommand {
    throw new Error('Composite commands cannot be merged');
  }
}

// Create a singleton instance
export const commandManager = new CommandManager();

// Global keyboard shortcut handler
export function setupKeyboardShortcuts(): void {
  const handleKeyDown = (event: KeyboardEvent): void => {
    // Check if we're in an input field
    const activeElement = document.activeElement;
    const isInInput = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      (activeElement as HTMLElement).contentEditable === 'true'
    );

    if (isInInput) return;

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const ctrlKey = isMac ? event.metaKey : event.ctrlKey;

    if (ctrlKey && event.key === 'z' && !event.shiftKey) {
      event.preventDefault();
      commandManager.undo();
    } else if (ctrlKey && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
      event.preventDefault();
      commandManager.redo();
    }
  };

  // Remove existing listener if any
  document.removeEventListener('keydown', handleKeyDown);
  
  // Add the new listener
  document.addEventListener('keydown', handleKeyDown);
}

// Initialize keyboard shortcuts
if (typeof window !== 'undefined') {
  setupKeyboardShortcuts();
}
