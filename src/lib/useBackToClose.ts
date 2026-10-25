import { useEffect, useRef } from "react";

/**
 * Makes the phone's Back button (or a swipe back) close a pop-up instead of leaving the page.
 * While `open` is true the pop-up owns one history step; closing it any other way gives the step back.
 */
export function useBackToClose(open: boolean, close: () => void) {
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  });
  useEffect(() => {
    if (!open) return;
    let ours = true;
    window.history.pushState({ avOverlay: true }, "");
    const onPop = () => {
      ours = false;
      closeRef.current();
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      if (ours) window.history.back();
    };
  }, [open]);
}
