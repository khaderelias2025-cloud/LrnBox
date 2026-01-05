
import Link from 'next/link';

const Navbar = () => {
  return (
    <nav className="bg-gray-800 p-4 flex justify-between items-center">
      <div className="text-2xl font-bold">
        <Link href="/">LearnZ</Link>
      </div>
      <div>
        <Link href="/profile">
          <img src="/user-avatar.png" alt="User Avatar" className="w-10 h-10 rounded-full cursor-pointer" />
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
