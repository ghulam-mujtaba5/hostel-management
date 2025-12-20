declare module 'canvas-confetti' {
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

  type Shape = 'square' | 'circle' | 'star';

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
