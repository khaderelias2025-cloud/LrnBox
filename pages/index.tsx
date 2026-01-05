
import Layout from '../../components/Layout/Layout';
import FeaturedBoxes from '../../components/Home/FeaturedBoxes';
import DailyChallenge from '../../components/Home/DailyChallenge';
import { Box } from '../../types';

const boxes: Box[] = [
  { id: '1', title: 'Learn TypeScript', description: 'A comprehensive guide to TypeScript.', imageUrl: '/ts-logo.png', lessons: [] },
  { id: '2', title: 'Mastering React', description: 'Become a pro in React.', imageUrl: '/react-logo.png', lessons: [] },
  { id: '3', title: 'Next.js for Beginners', description: 'The best way to build web apps.', imageUrl: '/next-logo.png', lessons: [] },
];

const HomePage = () => {
  return (
    <Layout>
      <div className="space-y-8">
        <DailyChallenge />
        <FeaturedBoxes boxes={boxes} />
      </div>
    </Layout>
  );
};

export default HomePage;
