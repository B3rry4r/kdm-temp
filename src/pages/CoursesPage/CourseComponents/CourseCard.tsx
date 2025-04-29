import { useNavigate } from 'react-router-dom';

type Props = {
  id: string;
  title: string;
  desc: string;
  imgSrc: string;
  tag: string;
  price: string | number | null;
  org_id: number | null;
}

const CourseCard = (props: Props) => {
  const navigate = useNavigate();

  const handleEnrollClick = () => {
    console.log('Navigating to course:', props.id);
    navigate(`/courses/course/${props.id}`);
  };

  // Format price (e.g., 30000 -> "$30,000")
  const formatPrice = (price: string | number | null): string => {
    if (price == null) return '';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return '';
    return `$${numPrice.toLocaleString()}`;
  };

  // Determine tag and price display
  const renderTagAndPrice = () => {
    const formattedPrice = formatPrice(props.price);
    if (props.tag === 'Free') {
      return <p className='text-[#68049B]'>Free</p>;
    }
    if (props.tag === 'Paid') {
      return (
        <div className='flex flex-col'>
          <p className='text-[#68049B]'>{formattedPrice || 'Paid'}</p>
        </div>
      );
    }
    if (props.tag === 'Org' || props.org_id) {
      return (
        <div className='flex flex-col'>
          <p className='text-[#68049B]'>Org</p>
          {formattedPrice && <p className='text-[#68049B] text-xs'>{formattedPrice}</p>}
        </div>
      );
    }
    return <p className='text-[#68049B]'>{props.tag}</p>;
  };

  return (
    <div className='rounded-xl bg-white w-full flex gap-2 flex-col p-3 h-90'>
      <div className='w-full rounded-md bg-gray-400 h-[50%]'>
        {props.imgSrc ? (
          <img src={props.imgSrc} alt={props.title} className='w-full h-full object-cover rounded-md' />
        ) : (
          <div className='w-full h-full bg-gray-400 rounded-md' />
        )}
      </div>
      <h1 className='text-xl font-bold'>{props.title}</h1>
      <p className='text-[12px] line-clamp-3'>{props.desc}</p>
      <div className='flex items-center mt-3 justify-between'>
        {renderTagAndPrice()}
        <button
          onClick={handleEnrollClick}
          className='py-2 px-4 bg-[#FFD30F] cursor-pointer rounded-lg font-bold text-xs'
        >
          Enroll Now
        </button>
      </div>
    </div>
  );
};

export default CourseCard;