import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { API_BASE_URL } from '../../services/api';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Package, 
  AlertTriangle, 
  Info, 
  ArrowRight, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';

// Customer Notifications History Page component
const Notifications = () => {
  const { user, accessToken } = useAuth();
  const { t } = useLanguage();

  const isStaff = !!user?.is_staff;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [filter, setFilter] = useState('ALL'); // 'ALL' or 'UNREAD'

  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const endpoint = isStaff 
        ? `${API_BASE_URL}/notifications/?admin=true` 
        : `${API_BASE_URL}/notifications/`;

      const res = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) throw new Error('Failed to load notifications.');

      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : (data.results || []));
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.message || 'Failed to load notifications.');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (accessToken) {
      fetchNotifications();
    }
  }, [accessToken, user]);

  // Mark single notification as read
  const handleMarkRead = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/${id}/read/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
      }
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    try {
      const endpoint = isStaff 
        ? `${API_BASE_URL}/notifications/read-all/?admin=true` 
        : `${API_BASE_URL}/notifications/read-all/`;

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setToast('All notifications marked as read.');
        setTimeout(() => setToast(''), 4000);
      }
    } catch (err) {
      console.error('Error marking all read:', err);
    }
  };

  const filteredList = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.is_read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getNotifIcon = (type) => {
    switch (type) {
      case 'ORDER_STATUS':
        return <Package className="w-5 h-5 text-emerald-600" />;
      case 'LOW_STOCK':
      case 'OUT_OF_STOCK':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            Account Updates
          </span>
          <h1 className="text-3xl font-black text-slate-900 mt-1">My Notifications</h1>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center space-x-1.5 bg-slate-900 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {toast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All ({notifications.length})
        </button>

        <button
          onClick={() => setFilter('UNREAD')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filter === 'UNREAD' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
            <p className="text-xs font-medium text-slate-500">Loading notifications...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-3 shadow-xs">
            <Bell className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Notifications</h3>
            <p className="text-xs text-slate-500">You don't have any updates right now.</p>
          </div>
        ) : (
          filteredList.map((n) => (
            <div
              key={n.id}
              className={`bg-white rounded-2xl border p-5 transition-all shadow-xs flex items-start justify-between gap-4 ${
                !n.is_read ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200/80'
              }`}
            >
              <div className="flex items-start space-x-3.5">
                <div className={`p-2.5 rounded-xl shrink-0 ${!n.is_read ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                  {getNotifIcon(n.notification_type)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse shrink-0" />
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-medium">{n.message}</p>

                  <div className="flex items-center space-x-3 pt-1 text-[11px] text-slate-400 font-semibold">
                    <span>{new Date(n.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>

                    {n.order && (
                      <Link to={isStaff ? `/admin/orders/${n.order}` : `/orders/${n.order}`} className="text-emerald-700 font-bold hover:underline flex items-center space-x-1">
                        <span>View Order #{n.order_number}</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {!n.is_read && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  title="Mark as read"
                  className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
};

export const NotificationsPage = Notifications;
export default Notifications;
