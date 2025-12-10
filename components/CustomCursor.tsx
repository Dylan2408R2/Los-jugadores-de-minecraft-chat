import React, { useEffect, useState } from 'react';

const CustomCursor: React.FC = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPointer, setIsPointer] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
      
      const target = e.target as HTMLElement;
      // Check if hovering over clickable elements
      const computedStyle = window.getComputedStyle(target);
      if (
        target.tagName.toLowerCase() === 'button' ||
        target.tagName.toLowerCase() === 'a' ||
        target.tagName.toLowerCase() === 'input' ||
        computedStyle.cursor === 'pointer'
      ) {
        setIsPointer(true);
      } else {
        setIsPointer(false);
      }
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', updatePosition);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', updatePosition);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, []);

  // Hide on mobile/touch devices essentially
  if (typeof navigator !== 'undefined' && 'ontouchstart' in window) {
      return null; 
  }

  return (
    <>
      {/* Main Cursor Dot */}
      <div
        className="fixed top-0 left-0 pointer-events-none z-[9999] transition-transform duration-75 ease-out mix-blend-difference"
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0) translate(-50%, -50%) scale(${isPointer ? 1.5 : 1})`,
          opacity: isVisible ? 1 : 0,
        }}
      >
        <div className={`w-4 h-4 bg-white rounded-full shadow-[0_0_10px_2px_rgba(255,255,255,0.8)]`} />
      </div>

      {/* Trailing Ring */}
      <div
        className="fixed top-0 left-0 pointer-events-none z-[9998] transition-all duration-300 ease-out"
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0) translate(-50%, -50%) scale(${isPointer ? 1.5 : 1})`,
          opacity: isVisible ? 1 : 0,
        }}
      >
        <div className={`w-8 h-8 border border-white/50 rounded-full ${isPointer ? 'bg-white/10 border-white' : ''}`} />
      </div>
    </>
  );
};

export default CustomCursor;