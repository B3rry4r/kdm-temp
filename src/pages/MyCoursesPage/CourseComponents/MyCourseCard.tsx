import { useNavigate } from 'react-router-dom';

type Props = {
  id: string;
  title: string;
  desc: string;
  imgSrc: string;
  link: string;
  tag: string;
  isStyleTwo?: boolean;
  completionPercent?: number;
}

const MyCourseCard = (props: Props) => {
  const navigate = useNavigate();

  const handleEnrollClick = () => {
    navigate(props.link);
  };

  return (
    <div className='rounded-xl bg-white w-full flex gap-2 flex-col p-3 h-90'>
      <div className='w-full rounded-md bg-gray-400 h-[50%]'>
        <img src={props.imgSrc} alt={props.title} className='w-full h-full object-cover rounded-md' />
      </div>

      <h1 className='text-xl font-bold'>{props.title}</h1>
      {props.isStyleTwo ? (
        <div className='flex flex-col my-3 gap-1'>
          <div className='w-full relative rounded-lg h-1 flex bg-gray-300'>
            <div
              className='absolute top-0 left-0 h-full rounded-lg bg-[#68049B]'
              style={{ width: `${props.completionPercent || 0}%` }}
            ></div>
          </div>
          <div className='flex gap-1 items-center'>
            <p className='font-bold text-sm text-[#68049B]'>{props.completionPercent || 0}%</p>
            <p className='text-xs text-gray-400'>Complete</p>
          </div>
        </div>
      ) : (
        <p className='text-[12px]'>{props.desc}</p>
      )}

      {props.isStyleTwo ? (
        <button
          onClick={handleEnrollClick}
          className='py-3 px-4 bg-[#FFD30F] cursor-pointer rounded-lg font-bold text-xs'
        >
          Continue Course
        </button>
      ) : (
        <div className='flex items-center mt-3 justify-between'>
          <p className='text-[#68049B]'>{props.tag}</p>
          <button
            onClick={handleEnrollClick}
            className='py-2 px-4 bg-[#FFD30F] cursor-pointer rounded-lg font-bold text-xs'
          >
            Enroll Now
          </button>
        </div>
      )}
    </div>
  );
};

export default MyCourseCard;