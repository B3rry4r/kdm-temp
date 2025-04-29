import { useNavigate } from "react-router-dom";
import { ForwardArrowSVG } from "../../assets/icons/icons";
import MessageSideBar from "./components/MessageSideBar";


const SingleMessage = () => {
  const navigate = useNavigate();

  const simulatedMessages = {
    id: 1,
    sender: "Alice",
    content: "Hello there!",
    timestamp: "March 14",
  };

  return (
    <div className="w-full">
      <div className="w-full p-6 border-b border-gray-300 pb-3 flex items-center">
        <div
          onClick={() => navigate(`/messages`)}
          className="cursor-pointer h-4 w-4 rotate-180 rounded-full flex items-center justify-center"
        >
          <ForwardArrowSVG size={13} />
        </div>
        <div className="w-12 h-12 bg-gray-400 mx-3 rounded-full">

        </div>
        <h1 className="text-lg font-bold">John Doe</h1>
      </div>
      <MessageSideBar message={simulatedMessages} />
    </div>
  );
};

export default SingleMessage;
