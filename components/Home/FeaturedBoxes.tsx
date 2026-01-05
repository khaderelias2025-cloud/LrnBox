
import { Box } from '../../types';
import BoxCard from '../Box/BoxCard';

interface FeaturedBoxesProps {
  boxes: Box[];
}

const FeaturedBoxes: React.FC<FeaturedBoxesProps> = ({ boxes }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Featured Boxes</h2>
      <div className="flex space-x-4 overflow-x-auto">
        {boxes.map(box => (
          <div key={box.id} className="w-80 flex-shrink-0">
            <BoxCard box={box} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeaturedBoxes;
