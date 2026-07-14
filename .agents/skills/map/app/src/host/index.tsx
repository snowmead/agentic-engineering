import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

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
  tone?: string;
  active?: boolean;
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
  onClick,
  title,
  style,
  children,
}: ButtonProps) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: controlPadding(size),
        borderRadius: 6,
        cursor: "pointer",
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
}: {
  onClick?: () => void;
  title?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
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
        cursor: "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Pill({
  size = "md",
  tone,
  active,
  style,
  children,
}: {
  size?: ControlSize;
  tone?: string;
  active?: boolean;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  void tone;
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
  lines: DiffLineData[];
  showLineNumbers?: boolean;
  coloredLineNumbers?: boolean;
  showAccentStrip?: boolean;
};

const LINE_BG: Record<DiffLineData["type"], string> = {
  added: "rgba(55, 148, 255, 0.12)",
  removed: "rgba(244, 71, 71, 0.12)",
  unchanged: "transparent",
  modified: "rgba(200, 160, 40, 0.12)",
};

const ACCENT: Record<DiffLineData["type"], string> = {
  added: HOST_THEME.accent.primary,
  removed: "#f44747",
  unchanged: "transparent",
  modified: "#c8a028",
};

export function DiffView({
  path,
  lines,
  showLineNumbers = true,
  coloredLineNumbers = false,
  showAccentStrip = false,
}: DiffViewProps) {
  void path;
  void coloredLineNumbers;
  return (
    <pre
      style={{
        margin: 0,
        padding: "8px 0",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: 12,
        lineHeight: 1.45,
        color: HOST_THEME.text.primary,
        overflow: "auto",
      }}
    >
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <tbody>
          {lines.map((line, i) => (
            <tr key={i} style={{ background: LINE_BG[line.type] }}>
              {showAccentStrip ? (
                <td
                  style={{
                    width: 3,
                    background: ACCENT[line.type],
                    padding: 0,
                  }}
                />
              ) : null}
              {showLineNumbers ? (
                <td
                  style={{
                    padding: "0 10px 0 12px",
                    textAlign: "right",
                    color: HOST_THEME.text.tertiary,
                    userSelect: "none",
                    whiteSpace: "nowrap",
                    verticalAlign: "top",
                  }}
                >
                  {line.lineNumber ?? i + 1}
                </td>
              ) : null}
              <td
                style={{
                  padding: "0 12px 0 8px",
                  whiteSpace: "pre",
                  verticalAlign: "top",
                }}
              >
                {line.content || " "}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </pre>
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
