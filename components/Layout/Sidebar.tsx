
import Link from 'next/link';

const Sidebar = () => {
  return (
    <div className="w-64 bg-gray-800 p-4 space-y-4">
      <Link href="/" className="block py-2 px-4 rounded hover:bg-gray-700">Home</Link>
      <Link href="/social" className="block py-2 px-4 rounded hover:bg-gray-700">Social</Link>
      <Link href="/events" className="block py-2 px-4 rounded hover:bg-gray-700">Events</Link>
      <Link href="/tutor" className="block py-2 px-4 rounded hover:bg-gray-700">Tutor</Link>
      <Link href="/messaging" className="block py-2 px-4 rounded hover:bg-gray-700">Messaging</Link>
      <Link href="/wallet" className="block py-2 px-4 rounded hover:bg-gray-700">Wallet</Link>
      <Link href="/settings" className="block py-2 px-4 rounded hover:bg-gray-700">Settings</Link>
    </div>
  );
};

export default Sidebar;
