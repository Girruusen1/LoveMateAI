import React from 'react';

/**
 * React.lazy for a named export: `lazyView(() => import('./X').then((m) => m.XView))`.
 * Pages and hub modes load this way so the first paint only ships the shell, the landing page and home.
 */
export const lazyView = <P extends object>(load: () => Promise<React.ComponentType<P>>) =>
  React.lazy(() => load().then((component) => ({ default: component })));
