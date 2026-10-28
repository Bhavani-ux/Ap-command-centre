import { RecentActivity } from '../../../types/dashboard.types';
import { formatDistanceToNow } from 'date-fns';

interface ActivityFeedProps {
  activities: RecentActivity[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'invoice_created':
        return '📄';
      case 'invoice_approved':
        return '✅';
      case 'invoice_rejected':
        return '❌';
      case 'payment_processed':
        return '💰';
      default:
        return '📋';
    }
  };

  const getActivityColor = (type: RecentActivity['type']) => {
    switch (type) {
      case 'invoice_created':
        return 'bg-blue-50 text-blue-600';
      case 'invoice_approved':
        return 'bg-green-50 text-green-600';
      case 'invoice_rejected':
        return 'bg-red-50 text-red-600';
      case 'payment_processed':
        return 'bg-purple-50 text-purple-600';
      default:
        return 'bg-gray-50 text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {activities.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No recent activity
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 p-2 rounded-full ${getActivityColor(activity.type)}`}>
                  <span className="text-lg">{getActivityIcon(activity.type)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                  <p className="text-sm text-gray-500">by {activity.user}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
