// components/SubmitButton.tsx
"use client";

import { useFormStatus } from "react-dom";
import { Button } from "./button";

interface SubmitButtonProps {
  label: string;
  pendingLabel: string;
  className?: string;
}

export function SubmitButton({
  label,
  pendingLabel,
  className,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className={className} {...props}>
      {pending ? pendingLabel : label}
    </Button>
  );
}
