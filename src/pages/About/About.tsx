import logo from "../../assets/logo_kdm.png";
import google from "../../assets/icons/google.svg";
import apple from "../../assets/icons/apple.svg";
import { FbSVG, IGSVG, XSVG } from "../../assets/icons/icons";
import { Link } from "react-router-dom";


const About = () => {
  return (
    <div className="w-full bg-white">
      <div className="flex justify-between items-center bg-white z-10 p-1 px-20 pr-32">
        <Link to={"/"}>
          <div className="w-50 bg-gray">
            <img src={logo} alt="logo" className="object-cover" />
          </div>
        </Link>
      </div>
      <div className="flex text-white bg-[#68049B] max-sm:h-30 max-sm:text-2xl items-center justify-center w-full h-50 text-3xl font-bold">
        Meet The Team
      </div>

      <div className="w-full flex mb-59 max-sm:my-6 max-sm:p-6 my-20 gap-15 flex-col items-center justify-center">
        <div className="w-[50%] grid grid-cols-3 max-sm:w-full items-center max-sm:grid-cols-2 gap-3">
          <UserCard />
          <UserCard />
          <UserCard />
          <UserCard />
          <UserCard />
          <UserCard />
        </div>
        <div className="w-[50%] max-sm:w-full max-sm:p-4 max-sm:flex-col max-sm:h-35 h-40 bg-gray-300 rounded-lg flex items-center justify-center">
          <div className="left w-[45%] max-sm:w-full h-full max-sm:h-auto max-sm:justify-start flex items-center justify-center gap-3">
            <h1 className="font-bold text-2xl max-sm:text-xl max-sm:mb-2 text-gray-600">Accreditied by</h1>
          </div>
          <div className="left w-[55%] max-sm:w-full h-full flex items-center justify-center gap-3">
            <div className="w-[45%] h-[70%] max-sm:h-full max-sm:w-full bg-gray-400 rounded-lg"></div>
            <div className="w-[45%] h-[70%] max-sm:h-full max-sm:w-full bg-gray-400 rounded-lg"></div>
          </div>
        </div>
      </div>
      <div className="w-full max-sm:p-6 h-60 max-sm:items-start max-sm:gap-4 max-sm:h-auto bg-gray-200 max-sm:flex-col flex p-30 items-center justify-between">
        <div className="flex">
          <div className=" relative bg-gray">
            <Link to={"/"}>
              <div className="w-50 relative">
                <img
                  src={logo}
                  alt="logo"
                  className="object-cover absolute left-[-26px]"
                />
              </div>
            </Link>
            <p className="text-xs mt-15">© Kudimata 2025 All rights reserved</p>
            <div className="flex w-full mt-7 items-center gap-3">
              <p className="text-xs font-semibold cursor-pointer">
                Privacy Policy
              </p>
              <p className="text-xs font-semibold cursor-pointer">
                Content Policy
              </p>
              <p className="text-xs font-semibold cursor-pointer">
                User Agreement
              </p>
            </div>
          </div>
        </div>
        <div className="flex max-sm:flex-col max-sm:mt-4 items-start gap-8">
          {/* App store and play store */}
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold">Download App</h2>
            <a
              href="#"
              className="flex items-center bg-black text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              <img src={google} alt="Google Play" className="w-7 h-7 mr-2" />
              <div>
                <div className="text-[8px]">GET IT ON</div>
                <div className="text-md font-semibold -mt-1">Google Play</div>
              </div>
            </a>
            <a
              href="#"
              className="flex items-center bg-black text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              <img src={apple} alt="App Store" className="w-6 h-6 mr-2" />
              <div>
                <div className="text-[8px]">Download on the</div>
                <div className="text-md font-semibold -mt-1">App Store</div>
              </div>
            </a>
          </div>
          <div className="flex gap-3 flex-col">
            <h2 className="text-sm font-semibold">Our Socials</h2>
            <div className="flex items-center gap-3">
              <div className="w-10 max-sm:p-2 h-10 flex items-center justify-center rounded-full bg-[#68049B]">
                <FbSVG size={20} color={"#ffffff"} />
              </div>

              <div className="w-10 max-sm:p-2 h-10 flex items-center justify-center rounded-full bg-[#68049B]">
                <XSVG size={14} color={"#ffffff"} />
              </div>

              <div className="w-10 max-sm:p-2 h-10 flex items-center justify-center rounded-full bg-[#68049B]">
                <IGSVG size={20} color={"#ffffff"} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const UserCard = () => {
  return (
    <div className="w-full flex flex-col items-center gap-3 justify-center">
      <div className="w-50 max-sm:w-35 max-sm:h-35 h-50 rounded-full bg-gray-300"></div>
      <h1 className="font-bold text-lg text-[#68049B]">Lorem Ipsum</h1>
    </div>
  );
};

export default About;
