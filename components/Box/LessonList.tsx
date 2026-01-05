
import { Lesson } from '../../types';
import LessonCard from './LessonCard';

interface LessonListProps {
  lessons: Lesson[];
  boxId: string;
}

const LessonList: React.FC<LessonListProps> = ({ lessons, boxId }) => {
  return (
    <div className="space-y-4">
      {lessons.map(lesson => (
        <LessonCard key={lesson.id} lesson={lesson} boxId={boxId} />
      ))}
    </div>
  );
};

export default LessonList;
