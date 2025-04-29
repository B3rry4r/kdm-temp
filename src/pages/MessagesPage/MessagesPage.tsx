import { useState, useEffect } from 'react';
import MessageSideBar from './components/MessageSideBar';
import search from '../../assets/icons/search.svg';
import MessageCard from './components/MessageCard';

type Message = {
  id: number;
  sender: string;
  content: string;
  timestamp: string;
};

const MessagesPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState<number | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize);
    handleResize();
    // Simulate fetching data from backend
    // const fetchMessages = async () => {
    //   const response = await fetch('/api/messages'); // Replace with actual API endpoint
    //   const data = await response.json();
    //   setMessages(data);
    // };
    // fetchMessages();

    // Simulated data
    const simulatedMessages = [
      { id: 1, sender: 'Alice', content: 'Hello there!', timestamp: 'March 14' },
      { id: 2, sender: 'Bob', content: 'How are you?', timestamp: 'May 14' },
      { id: 3, sender: 'Charlie', content: 'Good morning!', timestamp: 'April 14' },
    ];
    setMessages(simulatedMessages);

    return () => window.removeEventListener('resize', handleResize)
  }, []);

  const handleCardClick = (id: number) => {
    setActiveMessageId(id);
  };

  return (
    <div className='flex h-screen max-sm:mr-0 mr-30'>
      <div className='flex-[6] max-sm:w-full flex flex-col'>
        {/* Middle Section Content */}
        <div className='flex w-full flex-col gap-4 py-4 px-8'>
            <h1 className='text-xl font-bold'>Messages</h1>
            {/* Search Bar */}
            <div className="search_bar flex items-center bg-white rounded-md w-full">
                <div className="w-10 h-10 rounded-md flex items-center justify-center">
                    <img src={search} alt="search" className='object-cover' />
                </div>
                <input type="text" placeholder='Search something' className='w-full text-sm p-2 outline-none' />
            </div>
        </div>
        <div className=''>
          {messages.map((message) => (
            <MessageCard
              key={message.id}
              uniqueKey={`message-${message.id}`}
              isActive={message.id === activeMessageId}
              onClick={() => handleCardClick(message.id)}
              sender={message.sender}
              content={message.content}
              timestamp={message.timestamp}
              isMobile={isMobile}
              navLink='/messages/single-message'
            />
          ))}
        </div>
      </div>
      <div className='flex-[6] max-sm:hidden relative border-l border-r border-gray-200'>
        <MessageSideBar message={messages.find(msg => msg.id === activeMessageId) || null} />
      </div>
    </div>
  )
}

export default MessagesPage