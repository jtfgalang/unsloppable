import * as React from "react";
import tokens from "../taste/house-style-tokens.json";

export type HouseStyleSlug = keyof typeof tokens;
export type HouseStyleToken = (typeof tokens)[HouseStyleSlug];

export interface StyleProviderProps extends React.HTMLAttributes<HTMLDivElement> {
  styleName: HouseStyleSlug;
  children: React.ReactNode;
}

const invalidCssValue = /\b(?:based on|colors?|verified|true|false|primary only|light\/dark)\b/i;

function safeDesignVars(values: Record<string, string>) {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value && !invalidCssValue.test(value)));
}

function semanticVars(token: HouseStyleToken): React.CSSProperties {
  const designVars = token.designVars as Record<string, string>;
  const isConcrete = token.slug === "concrete";
  const { roles } = token;
  const radiusValue = designVars["--border-radius"]?.match(/\d+(?:\.\d+)?(?:px|rem|em|%)/)?.[0];
  const durationValue = designVars["--transition-duration"]?.match(/\d+(?:\.\d+)?(?:ms|s)/)?.[0];
  const weightValue = designVars["--font-weight"]?.match(/\b(?:[1-9]00)\b/)?.[0];
  const radius = radiusValue ?? (isConcrete ? "0px" : "18px");
  const duration = durationValue ?? (isConcrete ? "0ms" : "260ms");
  return {
    ...safeDesignVars(designVars),
    "--style-bg": roles.bg,
    "--style-surface": roles.surface,
    "--style-text": roles.text,
    "--style-muted": roles.muted,
    "--style-accent": roles.accent,
    "--style-on-accent": roles.onAccent,
    "--style-border": roles.border,
    "--style-focus": roles.border,
    "--style-radius": radius,
    "--style-duration": duration,
    "--style-shadow": isConcrete ? `8px 8px 0 ${roles.text}` : `0 24px 80px color-mix(in srgb, ${roles.accent} 15%, transparent)`,
    "--style-font-weight": weightValue ?? "650",
    "--style-blur": designVars["--blur-amount"] ?? "0px",
  } as React.CSSProperties;
}

export function getHouseStyle(styleName: HouseStyleSlug) {
  return tokens[styleName];
}

export function StyleProvider({ styleName, children, className = "", ...props }: StyleProviderProps) {
  const token = getHouseStyle(styleName);
  return <div {...props} className={`house-style ${className}`.trim()} data-style={styleName} data-style-category={token.category} data-color-scheme={token.colorScheme.name} data-color-mood={token.mood} data-color-mode={token.colorScheme.mode} style={{ ...props.style, ...semanticVars(token) }}>{children}</div>;
}
