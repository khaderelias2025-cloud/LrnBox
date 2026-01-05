
import { useState } from 'react';
import Layout from '../../components/Layout/Layout';
import GeneralSettings from '../../components/Settings/GeneralSettings';
import NotificationSettings from '../../components/Settings/NotificationSettings';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <Layout>
      <div className="flex space-x-8">
        <div className="w-1/4">
          <nav className="space-y-2">
            <a href="#" onClick={() => setActiveTab('general')} className={`block p-2 rounded-lg ${activeTab === 'general' ? 'bg-gray-700' : ''}`}>General</a>
            <a href="#" onClick={() => setActiveTab('notifications')} className={`block p-2 rounded-lg ${activeTab === 'notifications' ? 'bg-gray-700' : ''}`}>Notifications</a>
          </nav>
        </div>
        <div className="w-3/4">
          {activeTab === 'general' && <GeneralSettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
