import { useState } from "react";
import Header from "../../components/header/Header";
import LeftNavBar from "../../components/LeftNavBar/LeftNavBar";

type Props = {
  children: React.ReactNode;
};

const Layout = (props: Props) => {
    const [IsActive, setIsActive] = useState(false)
  
  return (
    <div className="w-full">
      
      <div className={`${IsActive ? 'bg-[rgba(249,243,253,1)] ' : 'bg-white'} w-11 h-11 items-center justify-center rounded-full hidden max-sm:flex fixed p-3 top-1 left-2 z-999 flex-col gap-1`}
      onClick={()=>{
        setIsActive(!IsActive)
        console.log('clidked');
        
      }}
      >
        <div className="w-full h-[2px] rounded-lg bg-black"></div>
        <div className="w-full h-[2px] rounded-lg bg-black"></div>
        <div className="w-full h-[2px] rounded-lg bg-black"></div>
      </div>
      <Header />
      <div className={`flex ${IsActive ? 'z-99' : ''} pt-[68px] max-sm:pt-[58px] max-sm:pl-0 h-screen bg-[rgba(249,243,253,1)] pl-18`}>
        <div
          className={`flex-[2] max-sm:absolute max-sm:bg-[rgba(249,243,253,1)] max-sm:z-99  max-sm:h-full max-sm:left-0 max-sm:top-0 overflow-y-auto ${
            IsActive
              ? "z-100 max-sm:w-[80%] max-sm:left-[-0%] max-sm:h-[800px] max-sm:pt-20"
              : "max-sm:left-[-120%]"
          }`}
        >
          {/* Left Navbar Content */}
          <LeftNavBar />
        </div>
        <div className="flex-7">
          {/* Middle Section Content */}
          {props.children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
