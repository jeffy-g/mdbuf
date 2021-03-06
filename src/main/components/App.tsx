import React, { useCallback, useLayoutEffect, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createGlobalStyle } from "styled-components";
import { AppState } from "../types";
import { changeToolMode, updateShowPreview, sync } from "../reducers";
import { BottomHelper } from "./elements/BottomHelper";
import { VisibilityDetector } from "./elements/VisibilityDetector";
import { KeyHandler } from "./KeyHandler";
import { Main } from "./Main";
import { useCurrentBuffer } from "../contexts/CurrentBufferContext";
import { getLastState } from "../store/createStore";

// Global State
let focusedOnce = false;

export function App() {
  const dispatch = useDispatch();
  const currentBuffer = useCurrentBuffer();
  const state = useSelector((s: AppState) => s);
  const editorRef: React.RefObject<HTMLTextAreaElement> = useRef(null);
  const previewContainerRef: React.RefObject<HTMLDivElement> = useRef(null);
  const onChangeToolMode = useAction(changeToolMode);

  const onWheel = useCallback((ev: any) => {
    if (ev.ctrlKey) {
      ev.preventDefault();
      if (previewContainerRef.current) {
        const scrollTop = previewContainerRef.current.scrollTop;
        previewContainerRef.current.scrollTop = scrollTop + ev.deltaY;
      }
    }
  }, []);

  useLayoutEffect(() => {
    if (!focusedOnce && editorRef.current) {
      focusedOnce = true;
      editorRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (!state.initialized) {
      (async () => {
        const state = await getLastState();
        dispatch(sync(state));
        if (currentBuffer) {
          currentBuffer.setValue(state.raw);
          currentBuffer.focus();
        }
      })();
    }
  }, [state.initialized, currentBuffer]);

  return (
    <>
      <GlobalStyle />
      <KeyHandler />
      <VisibilityDetector />
      <BottomHelper />
      <Main
        editorRef={editorRef}
        previewContainerRef={previewContainerRef}
        onChangeToolMode={onChangeToolMode}
        onWheel={onWheel}
      />
    </>
  );
}

const GlobalStyle = createGlobalStyle`
  .markdown-body { 
    padding: 10px;
    line-height: 1.3em;
  }

  .cursor-focused {
    background-color: rgba(255, 128, 128, 0.2);
  }

  ::-webkit-scrollbar {
    width: 7px;
  }

  ::-webkit-scrollbar-track {
    box-shadow: inset 0 0 6px rgba(128, 128, 128, 0.5);
  }

  ::-webkit-scrollbar-thumb {
    background-color: rgba(128, 128, 128, 0.5);
  }
`;

function useAction<T extends Function>(action: T, keys: Array<any> = []): T {
  const dispatch = useDispatch();
  // @ts-ignore
  return useCallback((...args: any) => {
    return dispatch(action(...args));
  }, keys);
}
