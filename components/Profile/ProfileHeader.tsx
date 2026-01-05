
import { User } from '../../types';

interface ProfileHeaderProps {
  user: User;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user }) => {
  return (
    <div className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg">
      <img src={user.avatar} alt={user.name} className="w-24 h-24 rounded-full" />
      <div>
        <h1 className="text-3xl font-bold">{user.name}</h1>
        <p className="text-gray-400">@{user.handle}</p>
        <p className="mt-2">{user.bio}</p>
      </div>
    </div>
  );
};

export default ProfileHeader;
