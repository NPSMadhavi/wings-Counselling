import { useEffect, useRef } from "react";

export function CursorGlow() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let cx = -999, cy = -999;
    let lx = -999, ly = -999;
    let raf;

    const onMove = (e) => {
      let node = document.elementFromPoint(e.clientX, e.clientY);
      let dark = false;

      while (node) {
        if (node.hasAttribute && node.hasAttribute("data-dark-section")) {
          dark = true;
          break;
        }
        node = node.parentElement;
      }

      cx = dark ? -999 : e.clientX;
      cy = dark ? -999 : e.clientY;
    };

    const tick = () => {
      lx += (cx - lx) * 0.07;
      ly += (cy - ly) * 0.07;

      el.style.background = `radial-gradient(circle 380px at ${lx}px ${ly}px, rgba(0,70,137,0.07) 0%, transparent 70%)`;

      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1,
        pointerEvents: "none",
      }}
    />
  );
}