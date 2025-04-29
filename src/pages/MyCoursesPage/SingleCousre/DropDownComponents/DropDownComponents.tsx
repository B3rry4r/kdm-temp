import { useEffect, useState } from "react";
// Import your required icons. Make sure paths are correct.
import { ChevronDownSVG, VideoCameraSVG, DocumentSVG } from "../../../../assets/icons/icons"; // Assuming TopicSVG is for Quiz, and TickSVG is for the completed state icon

import gsap from "gsap";
import { Check } from "lucide-react";

// Updated DropDownItem type to include 'type' and 'isCompleted'
type DropDownItem = {
  title: string;
  time: string;
  type: 'video' | 'document';// Include type
  isCompleted: boolean; // Include completion status for rendering
};

type Props = {
  numberOfLessons: string;
  totalTime: string;
  title: string;
  dropDownItems: DropDownItem[]; // Use the updated type
  id: string; // This is the section ID
  isUserOwned?: boolean; // Keep existing prop
  isNavStyle?: boolean; // Keep existing prop (used for conditional padding/font style)

  // Add a new optional prop for handling item clicks
  onLessonClick?: (lessonIndex: number) => void;
  // Optional: Prop to control initial open state if needed
  // initialOpen?: boolean;
};

const DropDownComponents = ({
  numberOfLessons,
  totalTime,
  title,
  dropDownItems,
  id, // Section ID
  isUserOwned = false, // Keep existing prop
  isNavStyle = false, // Keep existing prop
  onLessonClick, // Receive the new prop
  // initialOpen = false, // Default to false
}: Props) => {
  // Use initialOpen prop if provided, otherwise default to false
  const [isOpen, setIsOpen] = useState(false); // Kept useState for simplicity, add initialOpen logic if needed

  // Keep existing GSAP logic and associated styles required for the animation
  useEffect(() => {
    gsap.set(`.${id}-items`, {
      y: -10,
      opacity: 0,
    });

    gsap.set(`.${id}-toggle`, {
      height: 0,
      overflow: "hidden", // Essential for dropdown animation
    });

    // If you wanted initial open logic based on active item:
    // const initiallyOpen = isNavStyle && dropDownItems.some(item => /* check if item is the active one */);
    // setIsOpen(initiallyOpen);
    // if(initiallyOpen) dropDownEnter(); // Need to call manually after setting state
    // This would require passing activeLesson down or a flag per item

  }, [id]); // Dependency on id ensures effect reruns if id changes (unlikely here, but good practice)

   // Updated GSAP animation functions - keep height/opacity/padding animations
  const dropDownEnter = () => {
    const tl = gsap.timeline();
    tl.to(`.${id}-toggle`, {
      paddingTop: isNavStyle ? "8px" : "15px", // Keep conditional padding for layout
      height: "auto",
      duration: 0.3,
    }).to(
      `.${id}-items`,
      {
        y: 0,
        opacity: 1,
        duration: 0.3,
        stagger: 0.05,
      },
      "-=0.2"
    );
  };

  
const toggleDropDown = () => {
  setIsOpen(!isOpen);
};


  const dropDownExit = () => {
    const tl = gsap.timeline();
    tl.to(`.${id}-items`, {
      y: -10,
      opacity: 0,
      duration: 0.2,
      stagger: 0.05,
      ease: "power2.in",
    }).to(`.${id}-toggle`, {
      paddingTop: 0,
      height: 0,
      duration: 0.3,
      ease: "power2.inOut",
    }, "-=0.1");
  };


  // Use useEffect to trigger animations when isOpen changes
  useEffect(() => {
      if (isOpen) {
          dropDownEnter();
      } else {
          dropDownExit();
      }
  }, [isOpen]); // Dependency on isOpen


  // New handler for lesson item clicks
  const handleItemClick = (index: number) => {
    if (isNavStyle && onLessonClick) { // Ensure it's nav style AND handler is provided
      onLessonClick(index);
    }
    // Do NOT toggle the dropdown state here when an item is clicked in nav mode
  };

  // Helper to get the correct icon based on item type
  const getItemIcon = (type: 'video' | 'document') => {
      // Keep conditional icon size based on isNavStyle
      switch (type) {
          case 'video': return <VideoCameraSVG size={isNavStyle ? 16 : 20} />;
          case 'document': return <DocumentSVG size={isNavStyle ? 16 : 20} />;
          default: return null;
      }
  };

  return (
    // Reinstated the conditional outer container styles as per your provided code
    <div className={`w-full ${isNavStyle ? ' rounded-lg p-2' : 'bg-white p-4 rounded-lg'}`}>
      <div
        onClick={toggleDropDown} // This still handles expanding/collapsing the section
        // Keep cursor-pointer and conditional padding based on isNavStyle
        // Removed the bg/padding/rounded from here for non-nav style, as it's on the outer div now
        className={`w-full flex items-center justify-between cursor-pointer ${isNavStyle ? 'py-1' : ''}`}
      >
        <div className="flex gap-2 items-center">
          {/* Chevron icon */}
          <ChevronDownSVG
            size={13}
            color="gray"
            className={`transform transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
          {/* Section Title - Keep conditional font boldness/color for visual hierarchy */}
          <h1 className={`text-sm ${isNavStyle ? 'text-gray-800' : 'font-bold'}`}>{title}</h1>
        </div>
        {/* Number of Lessons / Total Time (Only shown if not nav style) */}
        {isNavStyle ? null : (
          <div className="text-xs max-sm:hidden text-gray-600 mt-2">
            {numberOfLessons} Lessons • {totalTime}
          </div>
        )}
      </div>
      {/* The dropdown list of lessons - keep px-1 for inner padding */}
      <div className={`${id}-toggle px-1`}>
        {dropDownItems.map((item, index) => (
          <div
            key={index}
            // Keep py-2 and cursor-pointer. Removed rounded, opacity styles.
            // ADDED BACK hover:bg-gray-100 conditionally
            className={`${id}-items py-2 px-2 cursor-pointer ${isNavStyle ? 'hover:bg-white' : ''}`}
            onClick={() => handleItemClick(index)} // Call handler (it checks isNavStyle internally)
          >
            <div className="flex justify-between items-center">
              {isUserOwned ? (
                <div className="flex gap-2 items-center">
                  {/* Completion Circle/Tick Logic - Keep this as requested */}
                  {item.isCompleted ? (
                      <div className="rounded-full w-4 h-4 mr-1 bg-[#68049B] flex items-center justify-center"> {/* Purple fill */}
                           {/* Using TopicSVG as per your code, assuming it's the tick */}
                          <Check size={12} color="white" />
                      </div>
                  ) : (
                      <div className="rounded-full w-4 h-4 border mr-1 border-gray-300"></div> // Bordered circle
                  )}

                  {/* Lesson Type Icon Logic - Keep this as requested */}
                  {getItemIcon(item.type)}

                  {/* Lesson Title - Removed line-through style */}
                  <span className={`text-xs ${isNavStyle ? 'text-gray-700' : ''}`}> {/* Removed line-through */}
                    {item.title}
                  </span>
                </div>
              ) : (
                 // Non-user-owned style (simplified)
                 // Keep basic text-xs and conditional color
                <span className={`text-xs ${isNavStyle ? 'text-gray-700' : ''}`}>{item.title}</span>
              )}
              {/* Lesson Time (Only shown if not nav style) - Keep basic text-xs and color */}
              {isNavStyle ? null : <span className="text-xs text-gray-600">{item.time}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DropDownComponents;