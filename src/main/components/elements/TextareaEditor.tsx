import React, {
  SyntheticEvent,
  forwardRef,
  useCallback,
  useLayoutEffect
} from "react";
import styled from "styled-components";
import { useCurrentBufferContext } from "../../contexts/CurrentBufferContext";

const TAB_STR = "  ";

type Props = {
  raw: string;
  disabled?: boolean;
  onChangeValue: (value: string) => void;
  onWheel: (event: SyntheticEvent<HTMLTextAreaElement>) => void;
};

export const TextareaEditor = forwardRef((props: Props, ref: any) => {
  const buffer = useCurrentBufferContext();

  let isComposing = false;

  // IME Control
  const onCompositionStart = useCallback(() => (isComposing = true), []);
  const onCompositionEnd = useCallback((ev: any) => {
    isComposing = false;
    props.onChangeValue(ev.target.value);
  }, []);
  const onChange = useCallback((ev: any) => {
    if (!isComposing) props.onChangeValue(ev.target.value);
  }, []);

  const onKeydown = useCallback((e: KeyboardEvent) => {
    // Tab Indent
    if (e.keyCode === 9 && !isComposing) {
      e.preventDefault();
      const el: HTMLTextAreaElement = e.target as any;
      let start: number = el.selectionStart;
      let end: number = el.selectionEnd;
      const raw = el.value;
      const lineStart = raw.substr(0, start).split("\n").length - 1;
      const lineEnd = raw.substr(0, end).split("\n").length - 1;
      const lines = raw.split("\n");
      lines.forEach((line, i) => {
        if (i < lineStart || i > lineEnd || lines[i] === "") {
          return;
        }
        if (!e.shiftKey) {
          // Insert tab at head
          lines[i] = TAB_STR + line;
          start += i == lineStart ? TAB_STR.length : 0;
          end += TAB_STR.length;
        } else if (lines[i].substr(0, TAB_STR.length) === TAB_STR) {
          // Delete tab at head
          lines[i] = lines[i].substr(TAB_STR.length);
          start -= i == lineStart ? TAB_STR.length : 0;
          end -= TAB_STR.length;
        }
      });
      const newRaw = lines.join("\n");
      el.value = newRaw;
      el.setSelectionRange(start, end);
      props.onChangeValue((e as any).target.value);
    }
  }, []);

  // focus on first mount
  useLayoutEffect(() => {
    if (ref.current) {
      buffer.set({
        getCursorPosition() {
          return ref.current.selectionStart;
        },
        setCursorPosition(pos: number) {
          const v = ref.current.value;
          ref.current.value = v.substring(0, pos);
          ref.current.scrollTop = pos;
          ref.current.value = v;
          ref.current.setSelectionRange(pos, pos);

        },
        focus() {
          if (ref.current) {
            ref.current.focus();
          }
        },
        getValue() {
          return ref.current.value;
        },
        setValue(value: string) {
          if (ref.current) {
            ref.current.value = value;
          }
        }
      });
      if (false && buffer.lastOffset) {
        ref.current.selectionStart = buffer.lastOffset;
        ref.current.selectionEnd = buffer.lastOffset;
      } else {
        ref.current.selectionStart = 0;
        ref.current.selectionEnd = 0;
      }
      ref.current.focus();
    }
    return () => {
      buffer.setOffset(ref.current.selectionStart);
      // debugger;
      buffer.set(null);
    };
  }, []);

  return (
    <StyledTextarea
      ref={ref}
      disabled={props.disabled}
      spellCheck={false}
      defaultValue={props.raw}
      onChange={onChange}
      onCompositionStart={onCompositionStart}
      onCompositionEnd={onCompositionEnd}
      onKeyDown={onKeydown as any}
      onWheel={props.onWheel}
    />
  );
});

const StyledTextarea = styled.textarea`
  width: 100%;
  height: calc(100vh - 10px);
  padding-top: 10px;
  padding-bottom: 10px;
  padding-left: 24px;
  box-sizing: border-box;
  outline: none;
  font-size: 1.1em;
  color: rgb(232, 232, 212);
  background: #2d2a2e;
  resize: none;
  border: none;
  line-height: 1.2;
  /* -wekbit-antia */
  -webkit-font-smoothing: antialiased;
  font-family: Menlo, Monaco, "Courier New", monospace, "Segoe UI", Tahoma,
    Geneva, Verdana, sans-serif;
  /* font-family: MonoAscii, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif; */
`;
