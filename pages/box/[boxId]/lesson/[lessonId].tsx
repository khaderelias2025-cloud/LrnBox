
import { useRouter } from 'next/router';
import Layout from '../../../../components/Layout/Layout';
import { Lesson } from '../../../../types';

const lesson: Lesson = {
  id: '1',
  title: 'Introduction to TypeScript',
  description: 'What is TypeScript and why use it?',
  isCompleted: true,
};

const LessonPage = () => {
  const router = useRouter();
  const { boxId, lessonId } = router.query;

  return (
    <Layout>
      <div>
        <h1 className="text-4xl font-bold">{lesson.title}</h1>
        <p className="mt-4">{lesson.description}</p>
        {/* Add lesson content here */}
      </div>
    </Layout>
  );
};

export default LessonPage;
