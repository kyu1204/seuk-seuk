// components/SubmitButton.tsx
"use client";

import { useFormStatus } from "react-dom";
import { Button } from "./button";

interface SubmitButtonProps {
  label: string;
  pendingLabel: string;
  className?: string;
  disabled?: boolean;
}

export function SubmitButton({
  label,
  pendingLabel,
  className,
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || disabled} className={className} {...props}>
      {pending ? pendingLabel : label}
    </Button>
  );
}
