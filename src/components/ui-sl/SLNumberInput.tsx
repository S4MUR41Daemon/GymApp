"use client";

import type { ComponentProps } from "react";
import { SLInput } from "./SLInput";

type Props = Omit<ComponentProps<typeof SLInput>, "type"> & {
  width?: number;
};

export function SLNumberInput({ width = 60, style, ...props }: Props) {
  return (
    <SLInput
      type="number"
      style={{
        width,
        ...style,
      }}
      {...props}
    />
  );
}
