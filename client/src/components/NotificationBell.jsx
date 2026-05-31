import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NotificationBell() {
  const { unreadCount, notifications, fetchNotifications, markAsRead, markAllAsRead, loading } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          position: 'relative', padding: '8px', color: 'var(--text-primary, #333)',
        }}
        aria-label="Notifications"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '2px', right: '2px',
            background: '#e74c3c', color: '#fff', borderRadius: '50%',
            width: '18px', height: '18px', fontSize: '11px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'bold',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', zIndex: 1000,
          width: '360px', maxHeight: '480px', overflowY: 'auto',
          background: '#fff', border: '1px solid #e0e0e0',
          borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 16px', borderBottom: '1px solid #eee',
          }}>
            <strong>Notifications</strong>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{ background: 'none', border: 'none', color: '#3498db', cursor: 'pointer', fontSize: '13px' }}
              >
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 && !loading && (
            <div style={{ padding: '24px', textAlign: 'center', color: '#999', fontSize: '14px' }}>
              No notifications yet
            </div>
          )}

          {loading && (
            <div style={{ padding: '16px', textAlign: 'center', color: '#999' }}>Loading...</div>
          )}

          {notifications.map(n => (
            <div
              key={n._id}
              onClick={() => { markAsRead(n._id); setOpen(false); }}
              style={{
                padding: '12px 16px', cursor: 'pointer',
                borderBottom: '1px solid #f0f0f0',
                background: n.read ? '#fff' : '#f0f7ff',
                transition: 'background 0.2s',
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: n.read ? 'normal' : '600', marginBottom: '4px' }}>
                {n.title}
              </div>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                {n.message}
              </div>
              <div style={{ fontSize: '11px', color: '#999' }}>{timeAgo(n.createdAt)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
