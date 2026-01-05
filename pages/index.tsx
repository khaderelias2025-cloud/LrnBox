
import Layout from '../components/Layout/Layout';
import FeaturedBoxes from '../components/Home/FeaturedBoxes';
import DailyChallenge from '../components/Home/DailyChallenge';
import { MOCK_BOXES } from '../constants';

const HomePage = () => {
  return (
    <Layout>
      <div className="space-y-8">
        <h1 className="text-4xl font-bold">Welcome to LrnBox</h1>
        <DailyChallenge />
        <FeaturedBoxes boxes={MOCK_BOXES} />
      </div>
    </Layout>
  );
};

export default HomePage;
