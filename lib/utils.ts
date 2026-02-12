import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function copyToClipboard(text: string) {
  if (typeof window === "undefined") return false;

  // 1. Try modern API first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn("Modern clipboard API failed, trying fallback...", err);
    }
  }

  // 2. Robust Fallback
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Ensure it's not visible but still "copyable"
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    textArea.style.opacity = "0";
    
    // Required for some mobile browsers
    textArea.contentEditable = "true";
    textArea.readOnly = false;
    
    document.body.appendChild(textArea);
    
    // Selection logic
    const range = document.createRange();
    range.selectNodeContents(textArea);
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    textArea.setSelectionRange(0, 999999);
    
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    
    if (selection) {
        selection.removeAllRanges();
    }
    
    return successful;
  } catch (err) {
    console.error("Clipboard fallback failed:", err);
    return false;
  }
}
