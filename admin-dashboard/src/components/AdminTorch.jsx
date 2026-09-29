import { useEffect, useRef } from "react";
import "./AdminTorch.css";

/* Torch-light cursor for the admin panel.
   A warm light follows the mouse like a hand torch,
   lighting the portion under the cursor. */
function AdminTorch() {
  const glowRef = useRef(null);
  const coreRef = useRef(null);

  useEffect(() => {
    const finePointer = window.matchMedia(
      "(pointer: fine)"
    ).matches;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (!finePointer || reducedMotion) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let glowX = targetX;
    let glowY = targetY;
    let raf = 0;
    let visible = false;

    const glow = glowRef.current;
    const core = coreRef.current;

    function handleMove(event) {
      targetX = event.clientX;
      targetY = event.clientY;

      if (!visible) {
        visible = true;
        glowX = targetX;
        glowY = targetY;
        if (glow) glow.style.opacity = "1";
        if (core) core.style.opacity = "1";
      }

      // Core follows instantly (the torch tip).
      if (core) {
        core.style.transform = `translate(${targetX}px, ${targetY}px) translate(-50%, -50%)`;
      }
    }

    function handleLeave() {
      visible = false;
      if (glow) glow.style.opacity = "0";
      if (core) core.style.opacity = "0";
    }

    function handleDown() {
      if (glow) glow.classList.add("torch-flash");
    }

    function handleUp() {
      if (glow) glow.classList.remove("torch-flash");
    }

    // Glow lags slightly behind, like holding a real torch.
    function tick() {
      glowX += (targetX - glowX) * 0.16;
      glowY += (targetY - glowY) * 0.16;

      if (glow) {
        glow.style.transform = `translate(${glowX}px, ${glowY}px) translate(-50%, -50%)`;
      }

      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);

    window.addEventListener(
      "pointermove",
      handleMove,
      { passive: true }
    );
    document.documentElement.addEventListener(
      "pointerleave",
      handleLeave
    );
    window.addEventListener("pointerdown", handleDown);
    window.addEventListener("pointerup", handleUp);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener(
        "pointermove",
        handleMove
      );
      document.documentElement.removeEventListener(
        "pointerleave",
        handleLeave
      );
      window.removeEventListener(
        "pointerdown",
        handleDown
      );
      window.removeEventListener("pointerup", handleUp);
    };
  }, []);

  return (
    <>
      <div
        ref={glowRef}
        className="admin-torch-glow"
        aria-hidden="true"
      />
      <div
        ref={coreRef}
        className="admin-torch-core"
        aria-hidden="true"
      />
    </>
  );
}

export default AdminTorch;
