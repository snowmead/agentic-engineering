import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { FileContents, SelectedLineRange } from "@pierre/diffs";
import { File as PierreFile } from "@pierre/diffs/react";
import type { FileTree as PierreFileTreeModel } from "@pierre/trees";
import {
  FileTree as PierreFileTreeView,
  useFileTree,
} from "@pierre/trees/react";

export type HostTheme = {
  bg: {
    editor: string;
    primary: string;
    elevated: string;
    chrome: string;
  };
  stroke: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    quaternary: string;
    link: string;
  };
  fill: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  accent: {
    primary: string;
  };
};

const HOST_THEME: HostTheme = {
  bg: {
    editor: "#1e1e1e",
    primary: "#181818",
    elevated: "#252526",
    chrome: "#2d2d2d",
  },
  stroke: {
    primary: "#6e6e6e",
    secondary: "#3c3c3c",
    tertiary: "#2a2a2a",
  },
  text: {
    primary: "#cccccc",
    secondary: "#9d9d9d",
    tertiary: "#6e6e6e",
    quaternary: "#5a5a5a",
    link: "#4ea1ff",
  },
  fill: {
    primary: "#3a3a3a",
    secondary: "#2f2f2f",
    tertiary: "#262626",
  },
  accent: {
    primary: "#3794ff",
  },
};

export type DiffLineData = {
  type: "added" | "removed" | "unchanged" | "modified";
  content: string;
  lineNumber?: number;
};

type FlexAlign = CSSProperties["alignItems"];
type FlexJustify = CSSProperties["justifyContent"];

type StackProps = {
  gap?: number | string;
  wrap?: boolean;
  align?: FlexAlign;
  justify?: FlexJustify;
  style?: CSSProperties;
  children?: ReactNode;
};

export function Stack({
  gap,
  wrap,
  align,
  justify,
  style,
  children,
}: StackProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap,
        flexWrap: wrap ? "wrap" : undefined,
        alignItems: align,
        justifyContent: justify,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Row({
  gap,
  wrap,
  align,
  justify,
  style,
  children,
}: StackProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap,
        flexWrap: wrap ? "wrap" : undefined,
        alignItems: align,
        justifyContent: justify,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

type TextProps = {
  tone?: "primary" | "secondary" | "tertiary" | "quaternary" | "link";
  weight?: "normal" | "medium" | "semibold" | "bold";
  size?: "small" | "medium" | "large";
  style?: CSSProperties;
  children?: ReactNode;
};

const TONE_COLOR: Record<NonNullable<TextProps["tone"]>, string> = {
  primary: HOST_THEME.text.primary,
  secondary: HOST_THEME.text.secondary,
  tertiary: HOST_THEME.text.tertiary,
  quaternary: HOST_THEME.text.quaternary,
  link: HOST_THEME.text.link,
};

const WEIGHT_MAP: Record<NonNullable<TextProps["weight"]>, number> = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

const SIZE_MAP: Record<NonNullable<TextProps["size"]>, string> = {
  small: "12px",
  medium: "14px",
  large: "16px",
};

export function Text({
  tone = "primary",
  weight = "normal",
  size = "medium",
  style,
  children,
}: TextProps) {
  return (
    <span
      style={{
        color: TONE_COLOR[tone],
        fontWeight: WEIGHT_MAP[weight],
        fontSize: SIZE_MAP[size],
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export function H1({
  style,
  children,
}: {
  style?: CSSProperties;
  children?: ReactNode;
}) {
  return (
    <h1
      style={{
        margin: 0,
        fontSize: 22,
        fontWeight: 650,
        color: HOST_THEME.text.primary,
        ...style,
      }}
    >
      {children}
    </h1>
  );
}

export function Code({
  style,
  children,
}: {
  style?: CSSProperties;
  children?: ReactNode;
}) {
  return (
    <code
      style={{
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: "0.92em",
        padding: "1px 4px",
        borderRadius: 4,
        background: HOST_THEME.fill.tertiary,
        color: HOST_THEME.text.primary,
        ...style,
      }}
    >
      {children}
    </code>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost";
type ControlSize = "sm" | "md" | "lg" | "small" | "medium" | "large";

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ControlSize;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  title?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

function controlPadding(size: ControlSize | undefined): string {
  switch (size) {
    case "sm":
    case "small":
      return "4px 8px";
    case "lg":
    case "large":
      return "8px 14px";
    default:
      return "6px 10px";
  }
}

function buttonStyles(
  variant: ButtonVariant,
  active: boolean | undefined,
): CSSProperties {
  if (variant === "primary" || active) {
    return {
      background: HOST_THEME.accent.primary,
      color: "#fff",
      border: `1px solid ${HOST_THEME.accent.primary}`,
    };
  }
  if (variant === "ghost") {
    return {
      background: "transparent",
      color: HOST_THEME.text.secondary,
      border: "1px solid transparent",
    };
  }
  return {
    background: HOST_THEME.fill.secondary,
    color: HOST_THEME.text.primary,
    border: `1px solid ${HOST_THEME.stroke.secondary}`,
  };
}

export function Button({
  variant = "secondary",
  size = "md",
  active,
  disabled,
  onClick,
  title,
  style,
  children,
}: ButtonProps) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: controlPadding(size),
        borderRadius: 6,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : undefined,
        fontSize: 13,
        lineHeight: 1.2,
        ...buttonStyles(variant, active),
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function IconButton({
  onClick,
  title,
  style,
  children,
  disabled,
}: {
  onClick?: () => void;
  title?: string;
  style?: CSSProperties;
  children?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 28,
        height: 28,
        padding: 0,
        borderRadius: 6,
        border: "1px solid transparent",
        background: "transparent",
        color: HOST_THEME.text.secondary,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Pill({
  size = "md",
  active,
  style,
  children,
}: {
  size?: ControlSize;
  active?: boolean;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: controlPadding(size),
        borderRadius: 999,
        fontSize: size === "sm" || size === "small" ? 11 : 12,
        background: active ? HOST_THEME.fill.secondary : HOST_THEME.fill.tertiary,
        color: active ? HOST_THEME.accent.primary : HOST_THEME.text.secondary,
        border: `1px solid ${
          active ? HOST_THEME.accent.primary : HOST_THEME.stroke.secondary
        }`,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

type DiffViewProps = {
  path?: string;
  language?: string;
  lines: DiffLineData[];
  showLineNumbers?: boolean;
  showAccentStrip?: boolean;
};

function fileNameFromPath(path: string | undefined): string {
  if (!path) return "file.txt";
  const base = path.split(/[/\\]/).pop();
  return base && base.length > 0 ? base : path;
}

function linesToContents(lines: DiffLineData[]): string {
  return lines.map((l) => l.content).join("\n");
}

function focusSelectedLines(
  lines: DiffLineData[],
): SelectedLineRange | undefined {
  const focused = lines
    .map((line, i) => ({ line, i }))
    .filter(
      ({ line }) =>
        line.type === "added" ||
        line.type === "removed" ||
        line.type === "modified",
    );
  if (focused.length === 0) return undefined;
  const nums = focused.map(({ line, i }) => line.lineNumber ?? i + 1);
  return { start: Math.min(...nums), end: Math.max(...nums) };
}

/** @pierre/diffs File viewer. */
export function DiffView({
  path,
  language,
  lines,
  showLineNumbers = true,
  showAccentStrip = false,
}: DiffViewProps) {
  const name = fileNameFromPath(path);
  const file: FileContents = {
    name,
    contents: linesToContents(lines),
    ...(language ? { lang: language as FileContents["lang"] } : {}),
  };
  const selectedLines = showAccentStrip
    ? focusSelectedLines(lines)
    : undefined;

  return (
    <PierreFile
      file={file}
      selectedLines={selectedLines}
      options={{
        disableLineNumbers: !showLineNumbers,
        disableFileHeader: true,
        overflow: "scroll",
      }}
      style={{
        fontSize: 12,
        lineHeight: 1.45,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      }}
    />
  );
}

export type FileTreePanelProps = {
  files: { relPath: string; absPath: string }[];
  selectedPaths: string[];
  hoverPaths: string[];
  theme: HostTheme;
  height: number;
  width: number;
  previewFile: (ref: { path: string }) => void;
};

function expandAncestors(model: PierreFileTreeModel, filePath: string) {
  const parts = filePath.split("/");
  let acc = "";
  for (let i = 0; i < parts.length - 1; i++) {
    acc = acc ? `${acc}/${parts[i]}` : parts[i]!;
    const item = model.getItem(acc);
    if (item?.isDirectory()) item.expand();
  }
}

function syncActivePaths(model: PierreFileTreeModel, active: string[]) {
  const prev = new Set(model.getSelectedPaths());
  const next = new Set(active);
  for (const p of prev) {
    if (!next.has(p)) model.getItem(p)?.deselect();
  }
  for (const p of next) {
    expandAncestors(model, p);
    model.getItem(p)?.select();
  }
}

/** @pierre/trees file panel. */
export function FileTreePanel({
  files,
  selectedPaths,
  hoverPaths,
  theme,
  height,
  width,
  previewFile,
}: FileTreePanelProps) {
  const relPaths = useMemo(() => files.map((f) => f.relPath), [files]);
  const absByRel = useMemo(() => {
    const m = new globalThis.Map<string, string>();
    for (const f of files) m.set(f.relPath, f.absPath);
    return m;
  }, [files]);

  const syncingRef = useRef(false);

  const { model } = useFileTree({
    paths: relPaths,
    initialExpansion: "closed",
    search: false,
    icons: "minimal",
    onSelectionChange: (selected) => {
      if (syncingRef.current) return;
      for (let i = selected.length - 1; i >= 0; i--) {
        const p = selected[i]!;
        const item = model.getItem(p);
        if (item && !item.isDirectory()) {
          const abs = absByRel.get(p);
          if (abs) previewFile({ path: abs });
          return;
        }
      }
    },
  });

  const active = useMemo(
    () => [...new Set([...selectedPaths, ...hoverPaths])],
    [selectedPaths, hoverPaths],
  );

  useEffect(() => {
    model.resetPaths(relPaths);
  }, [model, relPaths]);

  useEffect(() => {
    syncingRef.current = true;
    syncActivePaths(model, active);
    syncingRef.current = false;
  }, [model, active]);

  return (
    <aside
      style={{
        width,
        flexShrink: 0,
        boxSizing: "border-box",
        height,
        overflow: "hidden",
        borderRadius: 0,
        border: "none",
        background: theme.bg.elevated,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "12px 10px",
        fontFamily:
          '"IBM Plex Sans", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
      }}
    >
      <span
        style={{
          fontWeight: 600,
          fontSize: 14,
          color: theme.text.primary,
        }}
      >
        Files in this map
      </span>
      <div
        data-map-tree-scroll
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          background: theme.bg.elevated,
        }}
      >
        <PierreFileTreeView
          model={model}
          style={{
            height: "100%",
            width: "100%",
            // Match the map sidebar chrome — pierre falls back to #141415.
            backgroundColor: theme.bg.elevated,
            color: theme.text.primary,
            ["--trees-theme-sidebar-bg" as string]: theme.bg.elevated,
            ["--trees-bg-override" as string]: theme.bg.elevated,
          }}
        />
      </div>
    </aside>
  );
}

export function useHostTheme(): HostTheme {
  return HOST_THEME;
}

function storageKey(key: string): string {
  return `map:${key}`;
}

export function useCanvasState<T>(
  key: string,
  init: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(storageKey(key));
      if (raw == null) return init;
      return JSON.parse(raw) as T;
    } catch {
      return init;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(key), JSON.stringify(state));
    } catch {
      // ignore quota / private mode
    }
  }, [key, state]);

  return [state, setState];
}

type CanvasAction =
  | {
      type: "openFile";
      path: string;
      selection?: {
        startLineNumber: number;
        startColumn: number;
        endLineNumber: number;
        endColumn: number;
      };
    }
  | { type: string; [key: string]: unknown };

export function useCanvasAction(): (action: CanvasAction) => void {
  return useCallback((action: CanvasAction) => {
    if (action.type === "openFile" && typeof action.path === "string") {
      const path = action.path;
      const urls = [`vscode://file${path}`, `cursor://file${path}`];
      for (const url of urls) {
        try {
          const opened = window.open(url, "_blank");
          if (opened) return;
        } catch {
          // try next scheme
        }
      }
      console.log("[map-host] openFile", action);
      return;
    }
    console.log("[map-host] canvas action", action);
  }, []);
}
