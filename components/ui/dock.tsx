'use client';

import {
  motion,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
  type SpringOptions,
} from 'framer-motion';
import React, {
  createContext,
  useContext,
  useRef,
  PropsWithChildren,
} from 'react';
import { cn } from '../../lib/utils';

const DEFAULT_MAGNIFICATION = 1.2; // Scale factor
const DEFAULT_DISTANCE = 80;
const DEFAULT_PANEL_HEIGHT = 64; // Taller panel

type DockProps = {
  className?: string;
  distance?: number;
  panelHeight?: number;
  magnification?: number;
  spring?: SpringOptions;
};

type DockItemProps = {
  className?: string;
  onClick?: () => void;
};

type DocContextType = {
  mouseX: MotionValue;
  spring: SpringOptions;
  magnification: number;
  distance: number;
};

type DockProviderProps = {
  value: DocContextType;
};

const DockContext = createContext<DocContextType | undefined>(undefined);

const DockProvider: React.FC<PropsWithChildren<DockProviderProps>> = ({ children, value }) => {
  return <DockContext.Provider value={value}>{children}</DockContext.Provider>;
}

function useDock() {
  const context = useContext(DockContext);
  if (!context) {
    throw new Error('useDock must be used within an DockProvider');
  }
  return context;
}

const Dock: React.FC<PropsWithChildren<DockProps>> = ({
  children,
  className,
  spring = { stiffness: 250, damping: 30 },
  magnification = DEFAULT_MAGNIFICATION,
  distance = DEFAULT_DISTANCE,
  panelHeight = DEFAULT_PANEL_HEIGHT,
}) => {
  const mouseX = useMotionValue(Infinity);

  return (
      <motion.div
        onMouseMove={({ pageX, currentTarget }) => {
          const rect = currentTarget.getBoundingClientRect();
          mouseX.set(pageX - rect.left);
        }}
        onMouseLeave={() => {
          mouseX.set(Infinity);
        }}
        className={cn(
          'mx-auto flex h-full w-fit items-center gap-2 rounded-2xl bg-card/80 backdrop-blur-md border border-border px-2 dark:bg-card/50',
          className
        )}
        style={{ height: panelHeight }}
        role='toolbar'
        aria-label='Application dock'
      >
        <DockProvider value={{ mouseX, spring, distance, magnification }}>
          {children}
        </DockProvider>
      </motion.div>
  );
}

const DockItem: React.FC<PropsWithChildren<DockItemProps>> = ({ children, className, onClick }) => {
  const ref = useRef<HTMLButtonElement>(null);
  const { distance, magnification, mouseX, spring } = useDock();

  const mouseDistance = useTransform(mouseX, (val) => {
    const domRect = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    const elementLeft = domRect.x - (ref.current?.parentElement?.getBoundingClientRect().x ?? 0);
    return val - elementLeft - domRect.width / 2;
  });

  const scaleTransform = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [1, magnification, 1]
  );

  const scale = useSpring(scaleTransform, spring);

  return (
    <motion.button
      ref={ref}
      style={{ scale }}
      className={cn('transform-origin-bottom', className)}
      role='button'
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
}

export { Dock, DockItem };