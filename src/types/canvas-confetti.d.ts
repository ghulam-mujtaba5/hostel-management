declare module 'canvas-confetti' {
  interface PathShape {
    type: 'path';
    path: string | Path2D;
    matrix?: DOMMatrix;
  }

  type Shape = 'square' | 'circle' | 'star' | PathShape;

  namespace confetti {
    type Shape = 'square' | 'circle' | 'star' | PathShape;
  }

  interface Options {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: {
      x?: number;
      y?: number;
    };
    colors?: string[];
    shapes?: Shape[];
    scalar?: number;
    zIndex?: number;
    disableForReducedMotion?: boolean;
  }

  interface ConfettiFunction {
    (options?: Options): Promise<null>;
    reset: () => void;
    create: (
      canvas: HTMLCanvasElement | null,
      options?: { resize?: boolean; useWorker?: boolean }
    ) => ConfettiFunction;
  }

  const confetti: ConfettiFunction;
  export = confetti;
}
