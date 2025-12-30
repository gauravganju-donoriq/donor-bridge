import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from "react";
import { Canvas as FabricCanvas, PencilBrush } from "fabric";
import { Button } from "@/components/ui/button";
import { Eraser } from "lucide-react";

export interface SignaturePadRef {
  isEmpty: () => boolean;
  getSignatureDataURL: () => string | null;
  clear: () => void;
}

interface SignaturePadProps {
  width?: number;
  height?: number;
}

const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(
  ({ width = 500, height = 150 }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<FabricCanvas | null>(null);
    const [hasDrawn, setHasDrawn] = useState(false);
    const [isReady, setIsReady] = useState(false);

    // Initialize fabric canvas
    const initCanvas = useCallback(() => {
      if (!canvasRef.current || fabricRef.current) return;

      try {
        // Get container width for responsive sizing
        const containerWidth = containerRef.current?.clientWidth || width;
        const canvasWidth = Math.min(containerWidth - 4, width); // -4 for border

      const canvas = new FabricCanvas(canvasRef.current, {
          width: canvasWidth,
        height,
        backgroundColor: "#ffffff",
        isDrawingMode: true,
          selection: false,
          renderOnAddRemove: true,
      });

        // Create and configure the brush
        const brush = new PencilBrush(canvas);
        brush.color = "#000000";
        brush.width = 2;
        canvas.freeDrawingBrush = brush;

        // Track drawing
      canvas.on("path:created", () => {
        setHasDrawn(true);
      });

        // Store reference
        fabricRef.current = canvas;
        setIsReady(true);

        // Force a render
        canvas.renderAll();
      } catch (err) {
        console.error("Failed to initialize signature canvas:", err);
      }
    }, [width, height]);

    // Initialize after mount with delay to ensure DOM is ready
    useEffect(() => {
      const timer = setTimeout(() => {
        initCanvas();
      }, 100);

      return () => {
        clearTimeout(timer);
        if (fabricRef.current) {
          fabricRef.current.dispose();
          fabricRef.current = null;
        }
      };
    }, [initCanvas]);

    // Handle resize
    useEffect(() => {
      const handleResize = () => {
        if (!fabricRef.current || !containerRef.current) return;
        
        const containerWidth = containerRef.current.clientWidth;
        const canvasWidth = Math.min(containerWidth - 4, width);
        
        fabricRef.current.setDimensions({ width: canvasWidth, height });
        fabricRef.current.renderAll();
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, [width, height]);

    useImperativeHandle(ref, () => ({
      isEmpty: () => {
        if (!fabricRef.current) return true;
        return !hasDrawn || fabricRef.current.getObjects().length === 0;
      },
      getSignatureDataURL: () => {
        if (!fabricRef.current || fabricRef.current.getObjects().length === 0) return null;
        return fabricRef.current.toDataURL({
          format: "png",
          quality: 1,
          multiplier: 2,
        });
      },
      clear: () => {
        if (!fabricRef.current) return;
        fabricRef.current.clear();
        fabricRef.current.backgroundColor = "#ffffff";
        fabricRef.current.renderAll();
        setHasDrawn(false);
      },
    }));

    const handleClear = () => {
      if (!fabricRef.current) return;
      fabricRef.current.clear();
      fabricRef.current.backgroundColor = "#ffffff";
      fabricRef.current.renderAll();
      setHasDrawn(false);
    };

    return (
      <div className="space-y-2">
        <div 
          ref={containerRef}
          className="border-2 border-dashed border-muted-foreground/30 rounded-lg overflow-hidden bg-white"
          style={{ touchAction: "none" }}
        >
          <canvas 
            ref={canvasRef}
            style={{ 
              display: "block",
              touchAction: "none",
              cursor: "crosshair",
            }} 
          />
          {!isReady && (
            <div 
              className="flex items-center justify-center bg-muted/50 text-muted-foreground text-sm"
              style={{ width, height }}
            >
              Loading signature pad...
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {hasDrawn ? "Signature captured" : "Sign above using your mouse or touch screen"}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={!isReady}
          >
            <Eraser className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      </div>
    );
  }
);

SignaturePad.displayName = "SignaturePad";

export default SignaturePad;
