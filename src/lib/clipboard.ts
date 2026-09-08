/**
 * Copies the given text to the clipboard.
 *
 * Uses the async `navigator.clipboard.writeText` API when available. On
 * insecure origins (e.g. HTTP in local staging), inside unauthenticated
 * iframes, or when clipboard permissions are denied, that API rejects — so we
 * fall back to the synchronous `document.execCommand("copy")` strategy via a
 * temporary off-screen textarea.
 *
 * @param text - The text content to copy.
 * @returns `true` when the copy succeeded via any method, `false` otherwise.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Preferred path: modern async Clipboard API.
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Secure-context/permission failure — fall through to execCommand.
      console.warn("navigator.clipboard.writeText failed, using fallback", err);
    }
  }

  // Fallback: legacy execCommand("copy") on an off-screen textarea.
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    // Keep the textarea off-screen and invisible so the page does not flicker.
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.width = "2em";
    textarea.style.height = "2em";
    textarea.style.padding = "0";
    textarea.style.border = "none";
    textarea.style.outline = "none";
    textarea.style.boxShadow = "none";
    textarea.style.background = "transparent";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    const successful = document.execCommand("copy");
    document.body.removeChild(textarea);
    return successful;
  } catch (e) {
    console.error("Failed to copy to clipboard using fallback", e);
    return false;
  }
}
