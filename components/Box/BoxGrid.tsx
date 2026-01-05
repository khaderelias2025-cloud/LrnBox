
import { Box } from '../../types';
import BoxCard from './BoxCard';

interface BoxGridProps {
  boxes: Box[];
}

const BoxGrid: React.FC<BoxGridProps> = ({ boxes }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {boxes.map(box => (
        <BoxCard key={box.id} box={box} />
      ))}
    </div>
  );
};

export default BoxGrid;
