import React, { useState } from "react";

// Define the structure for each tab item
interface TabDataItem {
  label: string;
  content: React.ReactNode; // Use React.ReactNode to allow various content types
}

interface TabButtonProps {
  label: string;
  onClick: () => void;
  isActive: boolean;
}

const TabButton: React.FC<TabButtonProps> = ({ label, onClick, isActive }) => (
  // Added cursor-pointer for better UX
  <div className={` p-2 ${isActive ? 'border-[#68049B] border-b' : ''}`}>
    <button
      onClick={onClick}
      // Removed default button styling focus outline
      className={`cursor-pointer font-bold text-sm focus:outline-none tab-button ${isActive ? "active text-[#68049B]" : ""}`}
    >
      {label}
    </button>
  </div>
);

interface ContentProps {
  content: React.ReactNode; // Accept content dynamically
}

const Content: React.FC<ContentProps> = ({ content }) => {
  return <div>{content}</div>;
};

type Props = {
  tabData: TabDataItem[]; // Correctly type the tabData prop
};

const NavigationComponent = ({ tabData }: Props) => {
  const [activeTab, setActiveTab] = useState<number>(0); // Start with the first tab active

  const handleTabClick = (tabIndex: number) => {
    setActiveTab(tabIndex);
  };

  // Check if tabData is provided and not empty
  if (!tabData || tabData.length === 0) {
    return <div>No tab data provided.</div>;
  }

  return (
    <div>
      {/* Added flexbox for horizontal layout of tabs */}
      <div className="tab-navigation flex border-b border-gray-300 w-full">
        {/* Correctly mapping over tabData to render TabButton for each item */}
        {tabData.map((item, index) => (
          <TabButton
            key={index} // Added key for list rendering
            label={item.label} // Use the label from the item
            onClick={() => handleTabClick(index)} // Pass the index to handleTabClick
            isActive={activeTab === index} // Check if the current tab's index matches activeTab
          />
        ))}
      </div>
      <div className="tab-content max-sm:p-0 p-4"> {/* Added padding for content */}
        {/* Render the content for the active tab */}
        <Content content={tabData[activeTab].content} />
      </div>
    </div>
  );
};

export default NavigationComponent;