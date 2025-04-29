import { ChevronDownSVG } from "../../../assets/icons/icons";
import { useRef, useState } from "react";
import gsap from "gsap";
import { Link, useLocation } from "react-router-dom";
// import { FaChevronDown } from 'react-icons/fa';

type DropDownItem = {
  title: string;
  link: string;
};

type Props = {
  title: string;
  svgElement: React.ReactNode;
  isActive: boolean;
  isDropDown?: boolean;
  dropDownItems?: DropDownItem[];
  indentifier: string;
  setDropDownItems?: (items: string[]) => void;
  onClick?: () => void;
  onSubItemClick?: (subItem: string) => void;
  activeSubItem?: string | null;
  link?: string;
  dropDownLink?: string;
  isMailto?: boolean;
};

const SingleNavComponent = (props: Props) => {
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleToggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default link behavior to allow dropdown toggle
    if (!dropdownRef.current) return;

    const tl = gsap.timeline();

    if (!isDropdownOpen) {
      // Opening animation
      tl.fromTo(
        dropdownRef.current,
        { height: 0 },
        { height: "auto", duration: 0.3, ease: "power2.out" }
      ).fromTo(
        `.${props.indentifier}-dropdown-item`,
        {
          opacity: 0,
          y: 10,
        },
        {
          opacity: 1,
          y: 0,
          stagger: 0.05,
          duration: 0.2,
        },
        "-=0.1"
      );
    } else {
      // Closing animation
      tl.to(`.${props.indentifier}-dropdown-item`, {
        opacity: 0,
        y: -10,
        stagger: 0.05,
        duration: 0.2,
      }).to(
        dropdownRef.current,
        {
          height: 0,
          duration: 0.3,
          ease: "power2.in",
        },
        "-=0.1"
      );
    }

    setIsDropdownOpen(!isDropdownOpen);
  };

  const isActive =
    location.pathname === props.link ||
    props.dropDownItems?.some((item) => location.pathname === item.link);

  return (
    <div className="flex cursor-pointer flex-col pr-5 items-start justify-center gap-2">
      <div
        onClick={props.isDropDown ? handleToggleDropdown : props.onClick}
        className="flex items-center justify-between w-full"
      >
        {props.isMailto ? (
          <a
            href={props.link}
            className="flex items-center justify-between w-full"
          >
            <div className="flex clickable items-center justify-center gap-2">
              {props.svgElement}
              <p
                className={`text-sm font-medium ${
                  isActive ? "text-[#68049B]" : "text-[#2E2C2F]"
                }`}
              >
                {props.title}
              </p>
            </div>
            <div
              className={`transition-transform duration-300 cursor-pointer ${
                isDropdownOpen ? "rotate-180" : "rotate-0"
              }`}
            >
              {props.isDropDown && <ChevronDownSVG color="#2E2C2F" size={15} />}
            </div>
          </a>
        ) : (
          <Link
            to={props.link || "#"}
            className="flex items-center justify-between w-full"
          >
            <div className="flex clickable items-center justify-center gap-2">
              {props.svgElement}
              <p
                className={`text-sm font-medium ${
                  isActive ? "text-[#68049B]" : "text-[#2E2C2F]"
                }`}
              >
                {props.title}
              </p>
            </div>
            <div
              className={`transition-transform duration-300 cursor-pointer ${
                isDropdownOpen ? "rotate-180" : "rotate-0"
              }`}
            >
              {props.isDropDown && <ChevronDownSVG color="#2E2C2F" size={15} />}
            </div>
          </Link>
        )}
      </div>
      <div className="ml-2 pl-5 border-l border-gray-200">
        {props.isDropDown && (
          <div
            ref={dropdownRef}
            className="overflow-hidden flex flex-col gap-2"
            style={{ height: 0 }}
          >
            {props.dropDownItems?.map((item, index) => (
              <Link
                key={index}
                to={item.link}
                className={`${
                  props.indentifier
                }-dropdown-item text-xs py-1 hover:text-[#68049B] transition-colors ${
                  location.pathname === item.link ? "text-[#68049B]" : ""
                }`}
                onClick={() =>
                  props.onSubItemClick && props.onSubItemClick(item.title)
                }
              >
                {item.title}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SingleNavComponent;
