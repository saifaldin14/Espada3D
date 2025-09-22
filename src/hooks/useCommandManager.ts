import { useState, useEffect, useCallback } from 'react';
import { commandManager, CommandManagerState } from '../utils/commandManager';
import { ICommand } from '../utils/commands';

/**
 * React hook for using the command manager
 */
export function useCommandManager() {
  const [state, setState] = useState<CommandManagerState>(commandManager.getState());

  useEffect(() => {
    const unsubscribe = commandManager.subscribe(setState);
    return unsubscribe;
  }, []);

  const executeCommand = useCallback((command: ICommand) => {
    commandManager.executeCommand(command);
  }, []);

  const executeBatch = useCallback((commands: ICommand[], description?: string) => {
    commandManager.executeBatch(commands, description);
  }, []);

  const undo = useCallback(() => {
    return commandManager.undo();
  }, []);

  const redo = useCallback(() => {
    return commandManager.redo();
  }, []);

  const clear = useCallback(() => {
    commandManager.clear();
  }, []);

  const getHistory = useCallback(() => {
    return commandManager.getHistory();
  }, []);

  return {
    ...state,
    executeCommand,
    executeBatch,
    undo,
    redo,
    clear,
    getHistory,
  };
}
