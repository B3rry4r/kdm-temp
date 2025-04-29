import { useEffect, useState } from 'react';
import { ChevronDownSVG } from '../../../../assets/icons/icons';
import gsap from 'gsap';

type DropDownItem = {
  title: string;
  time?: string;
};

type Props = {
  numberOfLessons: string;
  totalTime: string;
  title: string;
  dropDownItems: DropDownItem[];
  id: string;
};

const DropDownComponents = ({ numberOfLessons, totalTime, title, dropDownItems, id }: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    gsap.set(`.${id}-items`, { y: -10, opacity: 0 });
    gsap.set(`.${id}-toggle`, { height: 0, overflow: 'hidden' });
  }, [id]);

  const dropDownEnter = () => {
    const tl = gsap.timeline();
    tl.to(`.${id}-toggle`, {
      paddingTop: '15px',
      height: 'auto',
    }).to(`.${id}-items`, { y: 0, opacity: 1 }, '-=0.2');
  };

  const dropDownExit = () => {
    const tl = gsap.timeline();
    tl.to(`.${id}-items`, { y: -10, opacity: 0, duration: 0.3 }).to(`.${id}-toggle`, {
      paddingTop: 0,
      height: 0,
      duration: 0.3,
    });
  };

  const toggleDropDown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      dropDownEnter();
    } else {
      dropDownExit();
    }
  };

  return (
    <div className="w-full rounded-lg p-4 bg-white">
      <div
        onClick={toggleDropDown}
        className="w-full flex flex items-center justify-between cursor-pointer"
      >
        <div className="flex gap-2 items-center">
          <ChevronDownSVG
            size={13}
            color="gray"
            className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
          <h1 className="text-sm font-bold">{title}</h1>
        </div>
        <div className="text-xs max-sm:hidden text-gray-600 mt-2">
          {numberOfLessons} Lessons • {totalTime}
        </div>
      </div>
      <div className={`${id}-toggle px-1`}>
        {dropDownItems.map((item, index) => (
          <div key={index} className={`${id}-items py-2`}>
            <div className="flex justify-between">
              <span className="text-xs">{item.title}</span>
              <span className="text-xs">{item.time || '-'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DropDownComponents;