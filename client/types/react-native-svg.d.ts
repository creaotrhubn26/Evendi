declare module "react-native-svg" {
  import * as React from "react";

  export interface SvgProps {
    width?: number | string;
    height?: number | string;
    viewBox?: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number | string;
    strokeLinecap?: "butt" | "round" | "square" | "inherit";
    strokeLinejoin?: "miter" | "round" | "bevel" | "inherit";
    children?: React.ReactNode;
  }

  export const Svg: React.FC<SvgProps>;
  export const Path: React.FC<SvgProps & { d: string }>;
  export const Rect: React.FC<SvgProps & { x?: number | string; y?: number | string; rx?: number | string; ry?: number | string; width?: number | string; height?: number | string }>;
  export const Polyline: React.FC<SvgProps & { points: string }>;
  export const Circle: React.FC<SvgProps & { cx?: number | string; cy?: number | string; r?: number | string }>;
}
