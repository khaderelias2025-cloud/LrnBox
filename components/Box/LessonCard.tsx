
import { Lesson } from '../../types';
import Link from 'next/link';

interface LessonCardProps {
  lesson: Lesson;
  boxId: string;
}

const LessonCard: React.FC<LessonCardProps> = ({ lesson, boxId }) => {
  return (
    <Link href={`/box/${boxId}/lesson/${lesson.id}`}>
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex items-center justify-between cursor-pointer">
        <div>
          <h4 className="text-lg font-bold">{lesson.title}</h4>
          <p className="text-gray-400">{lesson.description}</p>
        </div>
        {lesson.isCompleted && <span className="text-green-500">Completed</span>}
      </div>
    </Link>
  );
};

export default LessonCard;
