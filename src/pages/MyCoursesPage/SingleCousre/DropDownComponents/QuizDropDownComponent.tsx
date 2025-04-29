import { useEffect, useState } from 'react';
import { ChevronDownSVG } from '../../../../assets/icons/icons';
import gsap from 'gsap';
import { Check } from 'lucide-react';

type QuizDropDownItem = {
  title: string;
  time: string;
  type: 'quiz';
  isCompleted: boolean;
};

type Props = {
  numberOfLessons: string;
  totalTime: string;
  title: string;
  dropDownItems: QuizDropDownItem[];
  id: string;
  isUserOwned?: boolean;
  isNavStyle?: boolean;
  onLessonClick?: (lessonIndex: number) => void;
};

const QuizDropDownComponents = ({
  numberOfLessons,
  totalTime,
  title,
  dropDownItems,
  id,
  isUserOwned = false,
  isNavStyle = false,
  onLessonClick,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    gsap.set(`.${id}-items`, {
      y: -10,
      opacity: 0,
    });

    gsap.set(`.${id}-toggle`, {
      height: 0,
      overflow: 'hidden',
    });
  }, [id]);

  const dropDownEnter = () => {
    const tl = gsap.timeline();
    tl.to(`.${id}-toggle`, {
      paddingTop: isNavStyle ? '8px' : '15px',
      height: 'auto',
      duration: 0.3,
    }).to(
      `.${id}-items`,
      {
        y: 0,
        opacity: 1,
        duration: 0.3,
        stagger: 0.05,
      },
      '-=0.2'
    );
  };

  const dropDownExit = () => {
    const tl = gsap.timeline();
    tl.to(`.${id}-items`, {
      y: -10,
      opacity: 0,
      duration: 0.2,
      stagger: 0.05,
      ease: 'power2.in',
    }).to(
      `.${id}-toggle`,
      {
        paddingTop: 0,
        height: 0,
        duration: 0.3,
        ease: 'power2.inOut',
      },
      '-=0.1'
    );
  };

  useEffect(() => {
    if (isOpen) {
      dropDownEnter();
    } else {
      dropDownExit();
    }
  }, [isOpen]);

  const toggleDropDown = () => {
    setIsOpen(!isOpen);
  };

  const handleItemClick = (index: number) => {
    if (isNavStyle && onLessonClick) {
      onLessonClick(index);
    }
  };

  return (
    <div className={`w-full ${isNavStyle ? 'rounded-lg p-2' : 'bg-white p-4 rounded-lg'}`}>
      <div
        onClick={toggleDropDown}
        className={`w-full flex items-center justify-between cursor-pointer ${isNavStyle ? 'py-1' : ''}`}
      >
        <div className='flex gap-2 items-center'>
          <ChevronDownSVG
            size={13}
            color='gray'
            className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          />
          <h1 className={`text-sm ${isNavStyle ? 'text-gray-800' : 'font-bold'}`}>{title}</h1>
        </div>
        {isNavStyle ? null : (
          <div className='text-xs max-sm:hidden text-gray-600 mt-2'>
            {numberOfLessons} Lesson • {totalTime}
          </div>
        )}
      </div>
      <div className={`${id}-toggle px-1`}>
        {dropDownItems.map((item, index) => (
          <div
            key={index}
            className={`${id}-items py-2 px-2 cursor-pointer ${isNavStyle ? 'hover:bg-white' : ''}`}
            onClick={() => handleItemClick(index)}
          >
            <div className='flex justify-between items-center'>
              {isUserOwned ? (
                <div className='flex gap-2 items-center'>
                  {item.isCompleted ? (
                    <div className='rounded-full w-4 h-4 mr-1 bg-[#68049B] flex items-center justify-center'>
                      <Check size={10} color='white' />
                    </div>
                  ) : (
                    <div className='rounded-full w-4 h-4 border mr-1 border-gray-300'></div>
                  )}
                  <span className={`text-xs ${isNavStyle ? 'text-gray-700' : ''}`}>{item.title}</span>
                </div>
              ) : (
                <span className={`text-xs ${isNavStyle ? 'text-gray-700' : ''}`}>{item.title}</span>
              )}
              {isNavStyle ? null : <span className='text-xs text-gray-600'>{item.time}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuizDropDownComponents;