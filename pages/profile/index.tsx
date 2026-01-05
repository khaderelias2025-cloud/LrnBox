
import Layout from '../../components/Layout/Layout';
import ProfileHeader from '../../components/Profile/ProfileHeader';
import ProfileStats from '../../components/Profile/ProfileStats';
import { CURRENT_USER } from '../../constants';

const ProfilePage = () => {
  return (
    <Layout>
      <div className="space-y-8">
        <ProfileHeader user={CURRENT_USER} />
        <ProfileStats user={CURRENT_USER} />
        {/* Add more profile sections here */}
      </div>
    </Layout>
  );
};

export default ProfilePage;
