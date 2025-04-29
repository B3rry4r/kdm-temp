import { CloseSVG } from "../../../assets/icons/icons";

type Props = {
  test?: string;
};

const NotificationCard = (props: Props) => {
  return (
    <div className="w-full py-4 flex items-center justify-between">
      <div className="flex relative items-center gap-2">
        <div className="w-8 h-8 bg-gray-400 rounded-full"></div>
        <p className="text-xs truncate max-sm:w-30 w-60 h-5">
          <strong>{props.test}</strong>
          {" Posted: " +
            "Lorem ipsum dolor sit amet consectetur adipisicing elit. Nihil delectus necessitatibus commodi harum consectetur, voluptatibus, blanditiis ea, quia perspiciatis in suscipit labore veritatis incidunt quisquam sunt voluptate nemo aliquid quibusdam."}
        </p>
      </div>
      <div className="w-5 h-5 bg-gray-200 rounded-full p-1 cursor-pointer flex items-center justify-center">
        <CloseSVG size={15} />
      </div>
    </div>
  );
};

export default NotificationCard;
