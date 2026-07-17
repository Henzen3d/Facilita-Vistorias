"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SignaturePadProps = {
  onChange: (dataUrl: string | null) => void;
  className?: string;
};

/**
 * Native canvas signature pad (touch + mouse) — Phase 5 D-02.
 * Exports PNG data URL via onChange when the user draws.
 */
export function SignaturePad({ onChange, className = "" }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const emptyRef = useRef(true);
  const [isEmpty, setIsEmpty] = useState(true);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const width = parent?.clientWidth ?? 320;
    const height = 180;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#0f172a";
    // white background for PNG export
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  const getPos = (
    e: React.MouseEvent | React.TouchEvent,
  ): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const t = e.touches[0] ?? e.changedTouches[0];
      if (!t) return null;
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getPos(e);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!pos || !ctx) return;
    drawing.current = true;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    e.preventDefault();
    const pos = getPos(e);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!pos || !ctx) return;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    if (emptyRef.current) {
      emptyRef.current = false;
      setIsEmpty(false);
    }
  };

  const clear = () => {
    resizeCanvas();
    emptyRef.current = true;
    setIsEmpty(true);
    onChange(null);
  };

  // export after stroke ends (touch/mouse)
  const handleEnd = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    if (!canvas || emptyRef.current) return;
    onChange(canvas.toDataURL("image/png"));
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          className="w-full block cursor-crosshair touch-none"
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={handleEnd}
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          {isEmpty
            ? "Desenhe sua assinatura com o dedo ou mouse"
            : "Assinatura capturada"}
        </p>
        <button
          type="button"
          onClick={clear}
          className="text-xs font-semibold text-slate-600 underline min-h-[40px] px-2"
        >
          Limpar
        </button>
      </div>
    </div>
  );
}
