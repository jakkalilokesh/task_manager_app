import React, { useState } from 'react';
import { User, Mail, Calendar, Settings, Shield, Bell, Cloud, Database, Activity } from 'lucide-react';
import { User as UserType } from '../types';

interface AccountProps {
  user: UserType;
}

export const Account: React.FC<AccountProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    name: user.name,
    email: user.email,
    notifications: {
      emailReminders: true,
      pushNotifications: false,
      weeklyDigest: true
    }
  });

  const awsServices = [
    {
      name: 'AWS Cognito',
      description: 'User authentication and authorization',
      status: 'Active',
      icon: Shield,
      color: 'text-green-600 bg-green-100'
    },
    {
      name: 'AWS DynamoDB',
      description: 'NoSQL database for task storage',
      status: 'Active',
      icon: Database,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      name: 'AWS S3',
      description: 'File storage for attachments',
      status: 'Ready',
      icon: Cloud,
      color: 'text-purple-600 bg-purple-100'
    },
    {
      name: 'AWS Lambda',
      description: 'Serverless functions for processing',
      status: 'Active',
      icon: Activity,
      color: 'text-orange-600 bg-orange-100'
    },
    {
      name: 'AWS CloudWatch',
      description: 'Monitoring and logging',
      status: 'Active',
      icon: Activity,
      color: 'text-indigo-600 bg-indigo-100'
    }
  ];

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically update the user profile via AWS Cognito
    console.log('Profile updated:', profileData);
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'aws-services', name: 'AWS Services', icon: Cloud },
    { id: 'security', name: 'Security', icon: Shield }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h2>
        <p className="text-gray-600">Manage your profile and application preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            {activeTab === 'profile' && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h3>
                
                <div className="flex items-center space-x-6 mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{user.name}</h4>
                    <p className="text-gray-500">{user.email}</p>
                    <p className="text-sm text-gray-400">
                      Member since {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Update Profile
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Notification Preferences</h3>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Email Reminders</h4>
                      <p className="text-sm text-gray-500">Get email notifications for upcoming tasks</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profileData.notifications.emailReminders}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, emailReminders: e.target.checked }
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Push Notifications</h4>
                      <p className="text-sm text-gray-500">Receive browser push notifications</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profileData.notifications.pushNotifications}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, pushNotifications: e.target.checked }
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Weekly Digest</h4>
                      <p className="text-sm text-gray-500">Weekly summary of your tasks and progress</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profileData.notifications.weeklyDigest}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, weeklyDigest: e.target.checked }
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'aws-services' && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">AWS Services Integration</h3>
                <p className="text-gray-600 mb-8">Your application integrates with the following AWS services for enhanced functionality and scalability.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {awsServices.map((service) => {
                    const Icon = service.icon;
                    return (
                      <div key={service.name} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-start space-x-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${service.color}`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-gray-900">{service.name}</h4>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                service.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {service.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{service.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">AWS Integration Benefits</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Scalable and secure infrastructure</li>
                    <li>• Real-time data synchronization</li>
                    <li>• Automated backups and monitoring</li>
                    <li>• Global content delivery network</li>
                    <li>• Cost-effective serverless architecture</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Security Settings</h3>
                
                <div className="space-y-6">
                  <div className="p-6 border border-gray-200 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-4">Password & Authentication</h4>
                    <div className="space-y-4">
                      <button className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        Change Password
                      </button>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h5 className="font-medium text-gray-900">Two-Factor Authentication</h5>
                          <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                        </div>
                        <button className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                          Enable 2FA
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border border-gray-200 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-4">Account Activity</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-600">Last login</span>
                        <span className="text-sm font-medium text-gray-900">
                          {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-600">Account created</span>
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border border-red-200 rounded-lg bg-red-50">
                    <h4 className="font-semibold text-red-900 mb-4">Danger Zone</h4>
                    <p className="text-sm text-red-700 mb-4">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <button className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};