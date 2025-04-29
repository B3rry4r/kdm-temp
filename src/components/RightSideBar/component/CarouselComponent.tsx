import React, { useState, useEffect } from 'react';

const CarouselComponent: React.FC<{ children: React.ReactNode[] }> = ({ children }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const totalSlides = children.length;
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % totalSlides);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [totalSlides, isPaused]);

  const handleIndicatorClick = (index: number) => {
    setActiveIndex(index);
  };

  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  return (
    <div
      className='relative w-full h-full flex gap-4  flex-col items-center justify-center'
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className='w-full h-full flex relative rounded-lg overflow-hidden transition-opacity duration-1000' style={{ opacity: 1 }}>
        {children.map((child, index) => (
          <div
            key={index}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${index === activeIndex ? 'opacity-100' : 'opacity-0'}`}
          >
            {child}
          </div>
        ))}
      </div>
      <div className='flex items-center justify-center gap-2'>
        {children.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full ${index === activeIndex ? 'transition-all scale-130 bg-[#68049B]' : 'transition-all bg-gray-300'}`}
            onClick={() => handleIndicatorClick(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default CarouselComponent;