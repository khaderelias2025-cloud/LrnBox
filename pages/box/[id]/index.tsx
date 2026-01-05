
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout/Layout';
import BoxHeader from '../../../components/Box/BoxHeader';
import LessonList from '../../../components/Box/LessonList';
import { Box, Lesson } from '../../../types';

const box: Box = {
  id: '1',
  title: 'Learn TypeScript',
  description: 'A comprehensive guide to TypeScript.',
  imageUrl: '/ts-logo.png',
  lessons: [
    { id: '1', title: 'Introduction to TypeScript', description: 'What is TypeScript and why use it?', isCompleted: true },
    { id: '2', title: 'Basic Types', description: 'Learn about the basic types in TypeScript.', isCompleted: false },
    { id: '3', title: 'Interfaces', description: 'How to use interfaces to define shapes of objects.', isCompleted: false },
  ],
};

const BoxPage = () => {
  const router = useRouter();
  const { id } = router.query;

  return (
    <Layout>
      <div className="space-y-8">
        <BoxHeader box={box} />
        <LessonList lessons={box.lessons} boxId={id as string} />
      </div>
    </Layout>
  );
};

export default BoxPage;
