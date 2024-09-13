'use client';
import { useRef, useEffect, useState } from 'react';

type RotatingCircleProps = {
  theme: number;
};

export default function RotatingCircle({ theme }: RotatingCircleProps) {
  const [angle, setAngle] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const elRef = useRef<HTMLDivElement>(null);

  const getColor2 = (t: number): string => {
    switch (t) {
      case 0:
        return '#FF00FF';
      case 1:
        return '#1652F0';
      case 2:
        return '#00FF00';
      case 3:
        return '#ED7255';
      case 4:
        return '#231815';
      case 5:
        return '#00D395';
      default:
        return '#1652F0';
    }
  };

  const updateRotation = (event: MouseEvent) => {
    if (!elRef.current) return;
    const rect = elRef.current.getBoundingClientRect();
    const boxCenterX = rect.left + rect.width / 2;
    const boxCenterY = rect.top + rect.height / 2;
    const newAngle = Math.atan2(event.clientY - boxCenterY, event.clientX - boxCenterX);
    setAngle(newAngle * (180 / Math.PI));
  };

  const updatePosition = () => {
    if (elRef.current) {
      const viewportOffset = elRef.current.getBoundingClientRect();
      setPosition({ top: viewportOffset.top, left: viewportOffset.left });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      updateRotation(e);
      updatePosition();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', updatePosition);
    };
  }, []);

  const color1 = '#0052FF';
  const color2 = getColor2(theme);
  const color3 = '#FFF';

  return (
    <div
      ref={elRef}
      className="aspect-square w-full max-w-[400px] -rotate-90 overflow-hidden rounded-full"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      <div
        className="h-full w-full"
        style={{
          transform: `rotate(${angle}deg)`,
          background: `conic-gradient(from 180deg at 50% 50%, ${color1} 0deg, ${color2} 105.66210508346558deg, ${color3} 360deg, white 360deg)`,
        }}
      />
    </div>
  );
}