import { CommandManager } from '../utils/commandManager';

// Mock three.js GLTFLoader to avoid ESM import issues in Jest
jest.mock('three/examples/jsm/loaders/GLTFLoader', () => ({
  GLTFLoader: jest.fn(),
}));

// Define ICommand interface locally to match the one in commands.ts
interface ICommand {
  execute(): void;
  undo(): void;
  getDescription(): string;
  canMerge?(other: ICommand): boolean;
  merge?(other: ICommand): ICommand;
}

// Simple test command
class TestCommand implements ICommand {
  public executeCount = 0;
  public undoCount = 0;
  private value: number;
  public timestamp: number;

  constructor(value: number = 0) {
    this.value = value;
    this.timestamp = Date.now();
  }

  execute(): void {
    this.executeCount++;
  }

  undo(): void {
    this.undoCount++;
  }

  getDescription(): string {
    return `Test command ${this.value}`;
  }
}

class MergeableTestCommand implements ICommand {
  public value: number;
  public executeCount = 0;
  public undoCount = 0;
  public timestamp: number;

  constructor(value: number) {
    this.value = value;
    this.timestamp = Date.now();
  }

  execute(): void {
    this.executeCount++;
  }

  undo(): void {
    this.undoCount++;
  }

  getDescription(): string {
    return `Mergeable test command (${this.value})`;
  }

  canMerge(other: ICommand): boolean {
    return other instanceof MergeableTestCommand;
  }

  merge(other: ICommand): ICommand {
    const otherCmd = other as MergeableTestCommand;
    return new MergeableTestCommand(otherCmd.value);
  }
}

describe('CommandManager', () => {
  let manager: CommandManager;

  beforeEach(() => {
    manager = new CommandManager({
      maxHistorySize: 10,
      enableMerging: true,
      mergeTimeWindow: 500,
    });
  });

  describe('executeCommand', () => {
    it('should execute a command', () => {
      const cmd = new TestCommand();
      manager.executeCommand(cmd);

      expect(cmd.executeCount).toBe(1);
    });

    it('should track history', () => {
      const cmd1 = new TestCommand(1);
      const cmd2 = new TestCommand(2);

      manager.executeCommand(cmd1);
      manager.executeCommand(cmd2);

      const state = manager.getState();
      expect(state.historySize).toBe(2);
    });
  });

  describe('undo', () => {
    it('should undo the last command', () => {
      const cmd = new TestCommand();
      manager.executeCommand(cmd);
      manager.undo();

      expect(cmd.undoCount).toBe(1);
    });

    it('should not undo when history is empty', () => {
      // Should not throw
      manager.undo();
      const state = manager.getState();
      expect(state.canUndo).toBe(false);
    });

    it('should update canUndo state correctly', () => {
      expect(manager.getState().canUndo).toBe(false);

      manager.executeCommand(new TestCommand());
      expect(manager.getState().canUndo).toBe(true);

      manager.undo();
      expect(manager.getState().canUndo).toBe(false);
    });
  });

  describe('redo', () => {
    it('should redo an undone command', () => {
      const cmd = new TestCommand();
      manager.executeCommand(cmd);
      manager.undo();

      expect(manager.getState().canRedo).toBe(true);

      manager.redo();
      expect(cmd.executeCount).toBe(2); // Initial execute + redo
    });

    it('should not redo when nothing to redo', () => {
      manager.executeCommand(new TestCommand());

      expect(manager.getState().canRedo).toBe(false);
      manager.redo();
    });

    it('should clear redo stack after new command', () => {
      manager.executeCommand(new TestCommand(1));
      manager.undo();
      expect(manager.getState().canRedo).toBe(true);

      manager.executeCommand(new TestCommand(2));
      expect(manager.getState().canRedo).toBe(false);
    });
  });

  describe('history limit', () => {
    it('should trim history to max size', () => {
      for (let i = 0; i < 15; i++) {
        manager.executeCommand(new TestCommand(i));
      }

      expect(manager.getState().historySize).toBeLessThanOrEqual(10);
    });
  });

  describe('listeners', () => {
    it('should notify listeners on state change', () => {
      const listener = jest.fn();
      manager.subscribe(listener);

      manager.executeCommand(new TestCommand());
      expect(listener).toHaveBeenCalledTimes(1);

      manager.undo();
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('should support unsubscribe', () => {
      const listener = jest.fn();
      const unsubscribe = manager.subscribe(listener);

      manager.executeCommand(new TestCommand());
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      manager.executeCommand(new TestCommand());
      expect(listener).toHaveBeenCalledTimes(1); // Not called again
    });
  });

  describe('clear', () => {
    it('should clear all history', () => {
      manager.executeCommand(new TestCommand());
      manager.executeCommand(new TestCommand());
      manager.clear();

      const state = manager.getState();
      expect(state.historySize).toBe(0);
      expect(state.canUndo).toBe(false);
      expect(state.canRedo).toBe(false);
    });
  });

  describe('getState', () => {
    it('should return correct undo/redo descriptions', () => {
      const cmd1 = new TestCommand(1);
      const cmd2 = new TestCommand(2);

      manager.executeCommand(cmd1);
      manager.executeCommand(cmd2);

      let state = manager.getState();
      expect(state.undoDescription).toBe('Test command 2');

      manager.undo();
      state = manager.getState();
      expect(state.undoDescription).toBe('Test command 1');
      expect(state.redoDescription).toBe('Test command 2');
    });
  });
});
