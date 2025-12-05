import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Canvas as FabricCanvas } from "fabric";
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
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
    const [hasDrawn, setHasDrawn] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Wait for DOM to be ready before initializing fabric
    useEffect(() => {
      const frameId = requestAnimationFrame(() => {
        setMounted(true);
      });
      return () => cancelAnimationFrame(frameId);
    }, []);

    useEffect(() => {
      if (!mounted || !canvasRef.current) return;

      const canvas = new FabricCanvas(canvasRef.current, {
        width,
        height,
        backgroundColor: "#ffffff",
        isDrawingMode: true,
      });

      // Configure drawing brush
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = "#000000";
        canvas.freeDrawingBrush.width = 2;
      }

      // Track when user draws
      canvas.on("path:created", () => {
        setHasDrawn(true);
      });

      setFabricCanvas(canvas);

      return () => {
        canvas.dispose();
      };
    }, [mounted, width, height]);

    useImperativeHandle(ref, () => ({
      isEmpty: () => !hasDrawn || (fabricCanvas?.getObjects().length ?? 0) === 0,
      getSignatureDataURL: () => {
        if (!fabricCanvas || fabricCanvas.getObjects().length === 0) return null;
        return fabricCanvas.toDataURL({
          format: "png",
          quality: 1,
          multiplier: 2,
        });
      },
      clear: () => {
        if (!fabricCanvas) return;
        fabricCanvas.clear();
        fabricCanvas.backgroundColor = "#ffffff";
        fabricCanvas.renderAll();
        setHasDrawn(false);
      },
    }));

    const handleClear = () => {
      if (!fabricCanvas) return;
      fabricCanvas.clear();
      fabricCanvas.backgroundColor = "#ffffff";
      fabricCanvas.renderAll();
      setHasDrawn(false);
    };

    return (
      <div className="space-y-2">
        <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg overflow-hidden bg-white">
          <canvas ref={canvasRef} />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Sign above using your mouse or touch screen
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClear}
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
