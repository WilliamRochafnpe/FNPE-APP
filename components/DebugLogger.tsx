
import { useEffect } from "react";

interface DebugLoggerProps {
  data: any;
  label?: string;
}

export default function DebugLogger({ data, label = "LOG" }: DebugLoggerProps) {
  useEffect(() => {
    console.log(`[${label}]`, data);
  }, [data, label]);

  return null;
}
