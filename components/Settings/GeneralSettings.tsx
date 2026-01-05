
import { ChangeEvent, useState } from 'react';

const GeneralSettings = () => {
  const [name, setName] = useState('John Doe');
  const [email, setEmail] = useState('john.doe@example.com');

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">Name</label>
        <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 bg-gray-700 rounded-lg" />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium">Email</label>
        <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 bg-gray-700 rounded-lg" />
      </div>
      <button className="bg-blue-600 px-4 py-2 rounded-lg">Save</button>
    </div>
  );
};

export default GeneralSettings;
