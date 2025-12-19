import React, { createContext, useContext, useState, useRef, useCallback, useEffect, useMemo } from 'react';

const ClueContext = createContext(null);

export const ClueProvider = ({ children }) => {
  // persistent (user-click) vs transient (hover) clue IDs
  const [persistentClueId, setPersistentClueId] = useState(null);
  const persistentClueIdRef = useRef(persistentClueId);
  useEffect(() => { persistentClueIdRef.current = persistentClueId; }, [persistentClueId]);

  const [hoverClueId, setHoverClueId] = useState(null);
  const hoverClueIdRef = useRef(hoverClueId);
  useEffect(() => { hoverClueIdRef.current = hoverClueId; }, [hoverClueId]);

  // derived visible id (hover wins over persistent so hovering temporarily overrides persistent open)
  const visibleClueId = hoverClueId || persistentClueId;
  const visibleClueIdRef = useRef(visibleClueId);
  useEffect(() => { visibleClueIdRef.current = visibleClueId; }, [visibleClueId]);

  // Guards
  const typingInProgressRef = useRef(false);
  const blockReopenRef = useRef(false);
  const lastClosedIdRef = useRef(null);
  const callCounterRef = useRef(0);

  // Debug logging: warn on every visibleClueId change with stack
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.warn('🔴 visibleClueId CHANGED:', visibleClueId, '\nStack:', (new Error()).stack);
  }, [visibleClueId]);

  const setTypingInProgress = useCallback((isTyping) => {
    typingInProgressRef.current = !!isTyping;
    // eslint-disable-next-line no-console
    console.log('⌨️ setTypingInProgress:', typingInProgressRef.current);
  }, []);

  const closeClueUser = useCallback(({ force = false } = {}) => {
    // Only explicit forced closes should close
    if (!force) {
      // eslint-disable-next-line no-console
      console.log('closeClueUser blocked: missing force');
      return;
    }

    const closing = persistentClueIdRef.current;
    // eslint-disable-next-line no-console
    console.log('closeClueUser called', { closing, force, stack: (new Error()).stack });
    if (!closing) return;

    // Dev-only crash helper: set window.__crashOnNextClose = true in console and reproduce to get a full stack trace
    if (typeof window !== 'undefined' && (window.__crashOnNextClose || false) && process.env.NODE_ENV !== 'production') {
      window.__crashOnNextClose = false;
      // eslint-disable-next-line no-console
      console.error('Dev crash triggered for closeClueUser. Throwing to capture stack');
      throw new Error('Dev crash: closeClueUser called: ' + String(closing));
    }

    if (typeof window !== 'undefined') {
      window.__clueTrace = window.__clueTrace || { opens: [], closes: [], max: 120 };
      window.__clueTrace.closes.push({ id: closing, time: Date.now(), stack: (new Error()).stack });
      if (window.__clueTrace.closes.length > window.__clueTrace.max) window.__clueTrace.closes.shift();
    }

    setPersistentClueId(null);
    lastClosedIdRef.current = closing;
    blockReopenRef.current = true;

    // eslint-disable-next-line no-console
    console.log('🛡️ blockReopenRef set for 500ms', { lastClosed: lastClosedIdRef.current });
    setTimeout(() => {
      blockReopenRef.current = false;
      lastClosedIdRef.current = null;
      // eslint-disable-next-line no-console
      console.log('🛡️ blockReopenRef cleared');
    }, 500);
  }, []);

  const openClueUser = useCallback((id) => {
    callCounterRef.current += 1;
    const callNum = callCounterRef.current;
    // eslint-disable-next-line no-console
    console.log('🟢 openClueUser CALLED #' + callNum, { id, typing: typingInProgressRef.current, block: blockReopenRef.current, stack: (new Error()).stack });

    // Dev-only crash helper: set window.__crashOnNextOpen = true in console and reproduce to get a full stack trace
    if (typeof window !== 'undefined' && (window.__crashOnNextOpen || false) && process.env.NODE_ENV !== 'production') {
      // reset the flag and deliberately throw so the devtools capture the full unminified stack
      window.__crashOnNextOpen = false;
      // eslint-disable-next-line no-console
      console.error('Dev crash triggered for openClueUser. Throwing to capture stack');
      throw new Error('Dev crash: openClueUser called: ' + String(id));
    }

    if (!id) {
      // eslint-disable-next-line no-console
      console.log('❌ openClueUser blocked #' + callNum + ': no id');
      return;
    }

    if (typingInProgressRef.current) {
      // eslint-disable-next-line no-console
      console.log('❌ openClueUser blocked #' + callNum + ': typing in progress');
      return;
    }

    if (blockReopenRef.current && lastClosedIdRef.current === id) {
      // eslint-disable-next-line no-console
      console.log('❌ openClueUser blocked #' + callNum + ': recent close guard');
      return;
    }

    // Toggle: clicking same clue twice closes it
    if (persistentClueIdRef.current === id) {
      // eslint-disable-next-line no-console
      console.log('🔄 openClueUser: toggling close for', id);
      closeClueUser({ force: true });
      return;
    }

    // eslint-disable-next-line no-console
    console.log('✅ openClueUser #' + callNum + ': opening', id);
    if (typeof window !== 'undefined') {
      window.__clueTrace = window.__clueTrace || { opens: [], closes: [], max: 120 };
      window.__clueTrace.opens.push({ id, time: Date.now(), stack: (new Error()).stack });
      if (window.__clueTrace.opens.length > window.__clueTrace.max) window.__clueTrace.opens.shift();
    }
    setPersistentClueId(id);
  }, [closeClueUser]);

  // Hover-based open/close (transient)
  const openClueHover = useCallback((id) => {
    if (!id) return;
    // don't show hover while typing (prevent accidental opens)
    if (typingInProgressRef.current) return;
    setHoverClueId(id);
  }, []);

  const closeClueHover = useCallback(() => {
    setHoverClueId(null);
  }, []);

  const value = useMemo(() => ({
    // visible ID for UI rendering
    visibleClueId,
    // persistent ID (if any) opened via click
    persistentClueId,
    // user (click) controls
    openClueUser,
    closeClueUser,
    // hover (transient) controls
    openClueHover,
    closeClueHover,
    setTypingInProgress,
  }), [visibleClueId, persistentClueId, openClueUser, closeClueUser, openClueHover, closeClueHover, setTypingInProgress]);

  return (
    <ClueContext.Provider value={value}>{children}</ClueContext.Provider>
  );
};

export const useClue = () => {
  const ctx = useContext(ClueContext);
  if (!ctx) throw new Error('useClue must be used within a ClueProvider');
  return ctx;
};