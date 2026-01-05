
import { Box as BoxType } from '../../types';
import Link from 'next/link';

interface BoxCardProps {
  box: BoxType;
}

const BoxCard: React.FC<BoxCardProps> = ({ box }) => {
  return (
    <Link href={`/box/${box.id}`}>
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden cursor-pointer">
        <img src={box.thumbnail} alt={box.title} className="w-full h-48 object-cover" />
        <div className="p-4">
          <h3 className="text-xl font-bold">{box.title}</h3>
          <p className="text-gray-400">{box.description}</p>
        </div>
      </div>
    </Link>
  );
};

export default BoxCard;
