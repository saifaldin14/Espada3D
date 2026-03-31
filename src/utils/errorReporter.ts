/**
 * Error Reporting Service
 * 
 * Centralized error logging and reporting for the application.
 * Captures errors with context, stores them in-memory for debugging,
 * and provides hooks for external reporting services.
 */

export interface ErrorReport {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  context?: Record<string, any>;
  componentStack?: string;
  userAction?: string;
}

export type ErrorCategory =
  | 'render'        // React render errors
  | 'node-execution' // Node graph execution errors
  | 'scene'         // 3D scene errors
  | 'project'       // Project save/load errors
  | 'command'        // Command execution errors
  | 'network'       // Network/API errors
  | 'validation'    // Data validation errors
  | 'unknown';      // Uncategorized errors

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

const MAX_ERROR_LOG_SIZE = 100;

class ErrorReportingService {
  private errorLog: ErrorReport[] = [];
  private listeners: Array<(report: ErrorReport) => void> = [];

  /**
   * Report an error with context
   */
  report(
    error: Error | string,
    category: ErrorCategory = 'unknown',
    severity: ErrorSeverity = 'medium',
    context?: Record<string, any>
  ): ErrorReport {
    const report: ErrorReport = {
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'string' ? undefined : error.stack,
      category,
      severity,
      context,
    };

    // Store in-memory log
    this.errorLog.push(report);
    if (this.errorLog.length > MAX_ERROR_LOG_SIZE) {
      this.errorLog = this.errorLog.slice(-MAX_ERROR_LOG_SIZE);
    }

    // Console output based on severity
    if (severity === 'critical' || severity === 'high') {
      console.error(`[${category.toUpperCase()}] ${report.message}`, context || '');
    } else {
      console.warn(`[${category.toUpperCase()}] ${report.message}`, context || '');
    }

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(report);
      } catch (e) {
        // Don't let listener errors cascade
        console.error('Error in error listener:', e);
      }
    });

    return report;
  }

  /**
   * Report a React render error (from ErrorBoundary)
   */
  reportRenderError(error: Error, componentStack?: string): ErrorReport {
    return this.report(error, 'render', 'critical', { componentStack });
  }

  /**
   * Report a node execution error
   */
  reportNodeError(error: Error | string, nodeId: string, nodeType: string): ErrorReport {
    return this.report(error, 'node-execution', 'medium', { nodeId, nodeType });
  }

  /**
   * Report a project save/load error
   */
  reportProjectError(error: Error | string, operation: 'save' | 'load'): ErrorReport {
    return this.report(error, 'project', 'high', { operation });
  }

  /**
   * Report a command execution error
   */
  reportCommandError(error: Error | string, commandType: string): ErrorReport {
    return this.report(error, 'command', 'medium', { commandType });
  }

  /**
   * Subscribe to error reports
   */
  subscribe(listener: (report: ErrorReport) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Get all logged errors
   */
  getErrors(): ErrorReport[] {
    return [...this.errorLog];
  }

  /**
   * Get errors by category
   */
  getErrorsByCategory(category: ErrorCategory): ErrorReport[] {
    return this.errorLog.filter(e => e.category === category);
  }

  /**
   * Get recent errors
   */
  getRecentErrors(count: number = 10): ErrorReport[] {
    return this.errorLog.slice(-count);
  }

  /**
   * Clear all logged errors
   */
  clearErrors(): void {
    this.errorLog = [];
  }

  /**
   * Get error summary for debugging
   */
  getSummary(): {
    total: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
  } {
    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    this.errorLog.forEach(e => {
      byCategory[e.category] = (byCategory[e.category] || 0) + 1;
      bySeverity[e.severity] = (bySeverity[e.severity] || 0) + 1;
    });

    return {
      total: this.errorLog.length,
      byCategory,
      bySeverity,
    };
  }
}

// Singleton instance
export const errorReporter = new ErrorReportingService();

// Set up global unhandled error/rejection handlers
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    errorReporter.report(
      event.error || new Error(event.message),
      'unknown',
      'critical',
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      }
    );
  });

  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error
      ? event.reason
      : new Error(String(event.reason));
    errorReporter.report(error, 'unknown', 'high', {
      type: 'unhandled_promise_rejection',
    });
  });
}
