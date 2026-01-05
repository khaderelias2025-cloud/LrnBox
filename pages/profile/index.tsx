
import Layout from '../../components/Layout/Layout';
import ProfileHeader from '../../components/Profile/ProfileHeader';
import ProfileStats from '../../components/Profile/ProfileStats';
import { User } from '../../types';

const user: User = {
  id: '1',
  name: 'John Doe',
  handle: 'johndoe',
  bio: 'Learning and building in public.',
  avatar: '/user-avatar.png',
  followers: Array(42),
  following: Array(10),
  streak: 12,
};

const ProfilePage = () => {
  return (
    <Layout>
      <div className="space-y-8">
        <ProfileHeader user={user} />
        <ProfileStats user={user} />
      </div>
    </Layout>
  );
};

export default ProfilePage;
