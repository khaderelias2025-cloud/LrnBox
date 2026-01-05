
import { User } from '../../types';

interface ProfileStatsProps {
  user: User;
}

const ProfileStats: React.FC<ProfileStatsProps> = ({ user }) => {
  return (
    <div className="grid grid-cols-3 gap-4 text-center p-4 bg-gray-800 rounded-lg">
      <div>
        <p className="text-2xl font-bold">{user.followers.length}</p>
        <p className="text-gray-400">Followers</p>
      </div>
      <div>
        <p className="text-2xl font-bold">{user.following.length}</p>
        <p className="text-gray-400">Following</p>
      </div>
      <div>
        <p className="text-2xl font-bold">{user.streak}</p>
        <p className="text-gray-400">Streak</p>
      </div>
    </div>
  );
};

export default ProfileStats;
