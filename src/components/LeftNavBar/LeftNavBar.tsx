import { useState } from "react";
import { useLocation } from "react-router-dom";
import google from "../../assets/icons/google.svg";
import apple from "../../assets/icons/apple.svg";
import {
  EventsSVG,
  HomeSVG,
  SavedPostSVG,
  TopicSVG,
  InstitutionSVG,
  // MessageSVG,
  CoursesSVG,
  SpeatToAnAdvisorSVG,
} from "../../assets/icons/icons";
import SingleNavComponent from "./components/SingleNavComponent";
import { useData } from "../../context/DataContext/DataContext";

const LeftNavBar = () => {
  const { topics, institutions, loading, error } = useData();
  const location = useLocation();
  const [activeSubItem, setActiveSubItem] = useState<string | null>(null);

  const handleSubItemClick = (_mainTitle: string, subItem: string) => {
    setActiveSubItem(subItem);
  };

  const navItems = [
    { title: "Home", icon: HomeSVG, link: "/" },
    { title: "Saved Post", icon: SavedPostSVG, link: "/saved-posts" },
    // { title: "Message", icon: MessageSVG, link: "/messages" },
    {
      title: "Topic",
      icon: TopicSVG,
      isDropDown: true,
      dropDownItems: loading
        ? [{ title: "Loading...", link: "#" }]
        : error
        ? [{ title: "Error", link: "#" }]
        : topics.map((topic) => ({
            title: topic.name,
            link: `/topics/${topic.id}`,
          })),
    },
    {
      title: "Institution",
      icon: InstitutionSVG,
      isDropDown: true,
      dropDownItems: loading
        ? [{ title: "Loading...", link: "#" }]
        : error
        ? [{ title: "Error", link: "#" }]
        : Array.isArray(institutions)
        ? institutions.map((institution) => ({
            title: institution.name,
            link: `/institutions/${institution.id}`,
          }))
        : [{ title: "No Data", link: "#" }],
    },
    {
      title: "Courses",
      icon: CoursesSVG,
      isDropDown: true,
      dropDownItems: [
        { title: "Courses", link: "/courses/course" },
        { title: "My Courses", link: "/my-courses" },
      ],
    },
    {
      title: "Speak To An Advisor",
      icon: SpeatToAnAdvisorSVG,
      isMailto: true,
      link: "mailto:test@gmail.com",
    },
    { title: "Events", icon: EventsSVG, link: "/events" },
  ];

  return (
    <div className="w-full h-full relative">
      <div
        className={`w-full max-sm:absolute max-sm:bg-[rgba(249,243,253,1)] transition-all z-29 h-full border-r flex flex-col gap-6 border-gray-200 max-sm:pl-6 max-md:pl-3 max-lg:pl-0 pl-10 py-10 px-5`}
      >
        <div className="flex flex-col gap-6">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.link ||
              item.dropDownItems?.some(
                (dropItem) => location.pathname === dropItem.link
              ) ||
              false;
            return (
              <SingleNavComponent
                key={item.title}
                isActive={isActive}
                title={item.title}
                svgElement={
                  <item.icon
                    size={15}
                    color={isActive ? "#68049B" : "#2E2C2F"}
                  />
                }
                isDropDown={item.isDropDown}
                dropDownItems={item.dropDownItems}
                indentifier={item.title}
                onClick={() => setActiveSubItem(null)}
                onSubItemClick={(subItem) =>
                  handleSubItemClick(item.title, subItem)
                }
                activeSubItem={activeSubItem}
                link={item.link}
                isMailto={item.isMailto}
              />
            );
          })}
        </div>
        <div className="flex mt-5 flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <a href="https://www.kudimata.app/privacy" className="text-xs text-gray-500 cursor-pointer">
                Privacy Policy
              </a>
            </div>
            <div className="flex items-center gap-2">
              <a href="https://www.kudimata.app/privacy" className="text-xs text-gray-500 cursor-pointer">
                Content Policy
              </a>
              <a href="https://www.kudimata.app/privacy" className="text-xs text-gray-500 cursor-pointer">
                User Agreement
              </a>
            </div>
          </div>
          <div className="flex mt-3 flex-col mb-10 gap-3">
            <h2 className="text-sm font-semibold">Download App</h2>
            <a
              href="https://play.google.com/store/apps/details?id=com.esivue.kudi_mata&hl=en&pli=1"
              className="flex items-center bg-black text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              <img src={google} alt="Google Play" className="w-7 h-7 mr-2" />
              <div>
                <div className="text-[8px]">GET IT ON</div>
                <div className="text-md font-semibold -mt-1">Google Play</div>
              </div>
            </a>
            <a
              href="https://apps.apple.com/ng/app/kudimata/id1636961343"
              className="flex items-center bg-black text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              <img src={apple} alt="App Store" className="w-6 h-6 mr-2" />
              <div>
                <div className="text-[8px]">Download on the</div>
                <div className="text-md font-semibold -mt-1">App Store</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeftNavBar;

// Add custom scrollbar styles
document.documentElement.style.setProperty("--scrollbarBG", "transparent");
document.documentElement.style.setProperty("--thumbBG", "#c3c3c3");

const style = document.createElement("style");
style.innerHTML = `
  ::-webkit-scrollbar {
    width: 4px;
  }
  ::-webkit-scrollbar-track {
    background: var(--scrollbarBG);
  }
  ::-webkit-scrollbar-thumb {
    background-color: var(--thumbBG);
    border-radius: 10px;
    border: 0px solid var(--scrollbarBG);
  }
`;
document.head.appendChild(style);
