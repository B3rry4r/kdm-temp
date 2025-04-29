import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';


const SingleMessageCard = () => {
  const [isActive, setIsActive] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const iconsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive) {
      gsap.to(cardRef.current, { backgroundColor: '#f0f0f0', duration: 0.3 });
      gsap.to(iconsRef.current, { opacity: 1, duration: 0.3 });
    } else {
      gsap.to(cardRef.current, { backgroundColor: 'transparent', duration: 0.3 });
      gsap.to(iconsRef.current, { opacity: 0, duration: 0.3 });
    }
  }, [isActive]);

  return (
    <div
      ref={cardRef}
      className='w-full h-auto p-2 flex gap-2 relative cursor-pointer'
      onMouseEnter={() => setIsActive(true)}
      onMouseLeave={() => setIsActive(false)}
    >
      <div className='w-20%'>
        <div className='w-10 h-10 rounded-full bg-gray-200'>
          {/* <img src={''} alt="profile" className='object-cover' /> */}
        </div>
      </div>
      <div className='flex w-full flex-grow flex-col'>
        <div className="top flex items-center gap-1 mt-0">
          <p className='text-xs font-bold'>Chidera Johnson</p>
          <p className='text-[10px] text-gray-300'>12:30</p>
        </div>
        <div className="bottom flex pr-5 pt-2">
          <p className='text-[10px]'>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quos dolorem rerum numquam, nesciunt explicabo porro earum sed voluptates neque maxime!</p>
        </div>
      </div>
      <div ref={iconsRef} className='absolute bottom-[-25px] right-2 rounded-lg bg-white p-[1px]'>
        {/* Icons to show when active */}
        <div className='flex gap-1'>
          <div className='w-5 h-5 bg-gray-400 rounded-full'></div>
          <div className='w-5 h-5 bg-gray-400 rounded-full'></div>
          <div className='w-5 h-5 bg-gray-400 rounded-full'></div>
        </div>
      </div>
    </div>
  )
}

export default SingleMessageCard