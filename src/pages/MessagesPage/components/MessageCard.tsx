import { useRef } from "react";
import gsap from "gsap";
import { DeleteSVG } from "../../../assets/icons/icons";
import { Link } from "react-router-dom";

type Props = {
  isActive: boolean;
  onClick: () => void;
  sender: string;
  content: string;
  timestamp: string;
  uniqueKey: string;
  isMobile: boolean;
  navLink: string;
};

const MessageCard = (props: Props) => {
  const deleteBtn = useRef<HTMLDivElement>(null);

  const deleteEnter = () => {
    const tl = gsap.timeline();
    tl.fromTo(
      `.${props.uniqueKey}turnOff`,
      {
        x: 0,
        opacity: 1,
      },
      {
        x: 30,
        opacity: 0,
        ease: "power3.inOut",
        stagger: 0.08,
        duration: 0.5,
      }
    ).fromTo(
      deleteBtn.current,
      {
        opacity: 0,
        x: -30,
      },
      {
        opacity: 1,
        x: 0,
      },
      0.3
    );
  };

  const deleteLeave = () => {
    const tl = gsap.timeline();
    tl.to(deleteBtn.current, {
      opacity: 0,
      x: -30,
    }).to(
      `.${props.uniqueKey}turnOff`,
      {
        opacity: 1,
        x: 0,
        stagger: 0.08,
        duration: 0.5,
      },
      0.4
    );
  };

  return props.isMobile ? (
    <Link to={props.navLink}>
      <div
        onClick={props.onClick}
        className={`flex items-center w-full overflow-hidden justify-between p-4 ${
          props.isActive ? "bg-[#68049B]" : "hover:bg-gray-100"
        } transition-all duration-300 cursor-pointer`}
      >
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gray-200">
            {/* <img src={''} alt="profile" className='object-cover' /> */}
          </div>
          <div className="flex flex-col">
            <h2
              className={`text-sm ${
                props.isActive ? "text-[#FAFAFA]" : ""
              } font-bold`}
            >
              {props.sender}
            </h2>
            <p
              className={`text-[10px] ${
                props.isActive ? "text-[#FAFAFA]" : ""
              } truncate w-48`}
            >
              {props.content}
            </p>
          </div>
        </div>
        <div
          className="flex flex-col gap-1 relative items-end"
          onMouseLeave={deleteLeave}
          onMouseEnter={deleteEnter}
        >
          <p
            className={`${props.uniqueKey}turnOff text-[10px] ${
              props.isActive ? "text-[#FAFAFA]" : "text-gray-500"
            }`}
          >
            {props.timestamp}
          </p>
          {props.isActive ? null : (
            <div
              className={`${props.uniqueKey}turnOff w-3 h-3 rounded-full bg-[#68049B] flex items-center justify-center`}
            >
              <p className="text-[8px] text-[#FAFAFA]">1</p>
            </div>
          )}

          <div
            className="w-6 h-6 activeHover absolute m-auto top-0 opacity-0 right-0  bottom-0 z-10 rounded-full bg-white flex items-center justify-center"
            ref={deleteBtn}
          >
            <DeleteSVG size={14} />
          </div>
        </div>
      </div>
    </Link>
  ) : (
    <div
      onClick={props.onClick}
      className={`flex items-center w-full overflow-hidden justify-between p-4 ${
        props.isActive ? "bg-[#68049B]" : "hover:bg-gray-100"
      } transition-all duration-300 cursor-pointer`}
    >
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-gray-200">
          {/* <img src={''} alt="profile" className='object-cover' /> */}
        </div>
        <div className="flex flex-col">
          <h2
            className={`text-sm ${
              props.isActive ? "text-[#FAFAFA]" : ""
            } font-bold`}
          >
            {props.sender}
          </h2>
          <p
            className={`text-[10px] ${
              props.isActive ? "text-[#FAFAFA]" : ""
            } truncate w-48`}
          >
            {props.content}
          </p>
        </div>
      </div>
      <div
        className="flex flex-col gap-1 relative items-end"
        onMouseLeave={deleteLeave}
        onMouseEnter={deleteEnter}
      >
        <p
          className={`${props.uniqueKey}turnOff text-[10px] ${
            props.isActive ? "text-[#FAFAFA]" : "text-gray-500"
          }`}
        >
          {props.timestamp}
        </p>
        {props.isActive ? null : (
          <div
            className={`${props.uniqueKey}turnOff w-3 h-3 rounded-full bg-[#68049B] flex items-center justify-center`}
          >
            <p className="text-[8px] text-[#FAFAFA]">1</p>
          </div>
        )}

        <div
          className="w-6 h-6 activeHover absolute m-auto top-0 opacity-0 right-0  bottom-0 z-10 rounded-full bg-white flex items-center justify-center"
          ref={deleteBtn}
        >
          <DeleteSVG size={14} />
        </div>
      </div>
    </div>
  );
};

export default MessageCard;
