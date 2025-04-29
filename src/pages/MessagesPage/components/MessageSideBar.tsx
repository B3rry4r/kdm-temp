import SingleMessageTimeStamp from './SingleMessageComponent/SingleMessageTimeStamp';
import SingleMessageCard from './SingleMessageComponent/SingleMessageCard';
type MessageSideBarProps = {
  message: {
    sender: string;
    content: string;
    timestamp: string;
  } | null;
};

const MessageSideBar = ({ message }: MessageSideBarProps) => {
  if (!message) {
    return <div className=''>Select a message to view details</div>;
  }

  return (
    <div className='relative max-sm:px-4 flex flex-col w-full h-full'>
      <div className='w-full h-full overflow-y-scroll'>
        <div className='p-4'>
          <h2 className='text-md my-2 font-bold'>{message.sender}</h2>
        </div>
        {/* <p>{message.content}</p> */}
        {/* <p className='text-sm text-gray-500'>{message.timestamp}</p> */}
        <SingleMessageTimeStamp />
        <SingleMessageCard /> 
        <SingleMessageCard /> 
        <SingleMessageCard /> 
        <SingleMessageTimeStamp />
        <SingleMessageCard /> 
        <SingleMessageCard /> 
        <SingleMessageTimeStamp />
        <SingleMessageCard /> 
        <SingleMessageCard /> 
        <div className='spacer h-[250px]'>

        </div>
      </div>
      <div className='absolute max-sm:fixed max-sm:bottom-0 bottom-15 left-0 w-full bg-[rgba(255,255,255,0.3) rounded-lg backdrop-blur-xs ] w-full p-4'>
        <div className='bg-white p-2 rounded-xl'>
          <textarea className='w-full h-[50px] p-2 resize-none text-[10px] outline-none' placeholder='Type your message...'></textarea>
          <div className='flex justify-between items-center p-2 mt-2'>
            <div className='flex gap-1'>
              <div className='w-4 h-4 bg-gray-400 rounded-full'></div>
              <div className='w-4 h-4 bg-gray-400 rounded-full'></div>
              <div className='w-4 h-4 bg-gray-400 rounded-full'></div>
            </div>
            <button className='px-5 py-1 bg-gray-200 font-bold text-gray-500 text-xs rounded-lg'>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageSideBar; 