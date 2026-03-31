import { errorReporter, ErrorReport } from '../utils/errorReporter';

describe('ErrorReportingService', () => {
  beforeEach(() => {
    errorReporter.clearErrors();
  });

  describe('report', () => {
    it('should create an error report from an Error object', () => {
      const report = errorReporter.report(new Error('Test error'), 'unknown', 'medium');

      expect(report.message).toBe('Test error');
      expect(report.category).toBe('unknown');
      expect(report.severity).toBe('medium');
      expect(report.id).toBeTruthy();
      expect(report.timestamp).toBeTruthy();
    });

    it('should create an error report from a string', () => {
      const report = errorReporter.report('String error', 'validation', 'low');

      expect(report.message).toBe('String error');
      expect(report.category).toBe('validation');
      expect(report.stack).toBeUndefined();
    });

    it('should include context in the report', () => {
      const report = errorReporter.report(
        new Error('Test'),
        'scene',
        'high',
        { modelId: 'test-123', operation: 'transform' }
      );

      expect(report.context).toEqual({
        modelId: 'test-123',
        operation: 'transform',
      });
    });

    it('should store errors in the log', () => {
      errorReporter.report('Error 1', 'unknown');
      errorReporter.report('Error 2', 'scene');

      const errors = errorReporter.getErrors();
      expect(errors).toHaveLength(2);
    });

    it('should limit error log size', () => {
      // The MAX_ERROR_LOG_SIZE is 100 (private constant)
      for (let i = 0; i < 110; i++) {
        errorReporter.report(`Error ${i}`, 'unknown');
      }

      const errors = errorReporter.getErrors();
      expect(errors.length).toBeLessThanOrEqual(100);
    });
  });

  describe('specialized reporters', () => {
    it('should report render errors', () => {
      const report = errorReporter.reportRenderError(new Error('Render failed'), '<App />');

      expect(report.category).toBe('render');
      expect(report.severity).toBe('critical');
      expect(report.context?.componentStack).toBe('<App />');
    });

    it('should report node errors', () => {
      const report = errorReporter.reportNodeError('Division by zero', 'node-123', 'math');

      expect(report.category).toBe('node-execution');
      expect(report.severity).toBe('medium');
      expect(report.context?.nodeId).toBe('node-123');
      expect(report.context?.nodeType).toBe('math');
    });

    it('should report project errors', () => {
      const report = errorReporter.reportProjectError(new Error('Save failed'), 'save');

      expect(report.category).toBe('project');
      expect(report.severity).toBe('high');
      expect(report.context?.operation).toBe('save');
    });

    it('should report command errors', () => {
      const report = errorReporter.reportCommandError('Undo failed', 'UpdateTransform');

      expect(report.category).toBe('command');
      expect(report.context?.commandType).toBe('UpdateTransform');
    });
  });

  describe('subscribe', () => {
    it('should notify listeners on new errors', () => {
      const listener = jest.fn();
      errorReporter.subscribe(listener);

      errorReporter.report('Test error', 'unknown');

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Test error',
      }));
    });

    it('should support unsubscribe', () => {
      const listener = jest.fn();
      const unsubscribe = errorReporter.subscribe(listener);

      errorReporter.report('Error 1', 'unknown');
      unsubscribe();
      errorReporter.report('Error 2', 'unknown');

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('getErrorsByCategory', () => {
    it('should filter errors by category', () => {
      errorReporter.report('Error 1', 'scene');
      errorReporter.report('Error 2', 'project');
      errorReporter.report('Error 3', 'scene');

      const sceneErrors = errorReporter.getErrorsByCategory('scene');
      expect(sceneErrors).toHaveLength(2);
    });
  });

  describe('getRecentErrors', () => {
    it('should return the last N errors', () => {
      for (let i = 0; i < 20; i++) {
        errorReporter.report(`Error ${i}`, 'unknown');
      }

      const recent = errorReporter.getRecentErrors(5);
      expect(recent).toHaveLength(5);
      expect(recent[4].message).toBe('Error 19');
    });
  });

  describe('getSummary', () => {
    it('should return correct summary', () => {
      errorReporter.report('Error 1', 'scene', 'high');
      errorReporter.report('Error 2', 'scene', 'medium');
      errorReporter.report('Error 3', 'project', 'high');

      const summary = errorReporter.getSummary();
      expect(summary.total).toBe(3);
      expect(summary.byCategory['scene']).toBe(2);
      expect(summary.byCategory['project']).toBe(1);
      expect(summary.bySeverity['high']).toBe(2);
      expect(summary.bySeverity['medium']).toBe(1);
    });
  });

  describe('clearErrors', () => {
    it('should clear all errors', () => {
      errorReporter.report('Error 1', 'unknown');
      errorReporter.report('Error 2', 'unknown');
      errorReporter.clearErrors();

      expect(errorReporter.getErrors()).toHaveLength(0);
    });
  });
});
