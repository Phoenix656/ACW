import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function NotificationsList() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get('/api/notifications');
        setNotifications(res.data);
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    };
    fetch();
  }, []);

  return (
    <div className="container">
      <h2>Pending Notifications</h2>
      <ul>
        {notifications.map(n => (
          <li key={n.notification_id}>
            {n.document_name} – {n.message} ({n.notification_type})
          </li>
        ))}
      </ul>
    </div>
  );
}
