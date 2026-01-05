
const NotificationSettings = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label htmlFor="push" className="text-sm font-medium">Push Notifications</label>
        <input type="checkbox" id="push" className="form-checkbox" />
      </div>
      <div className="flex items-center justify-between">
        <label htmlFor="email" className="text-sm font-medium">Email Notifications</label>
        <input type="checkbox" id="email" className="form-checkbox" />
      </div>
    </div>
  );
};

export default NotificationSettings;
