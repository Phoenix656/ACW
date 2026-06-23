import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function MasterView() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get('/api/users'); // assume endpoint exists for admin
        setUsers(res.data);
      } catch (err) {
        console.error('Failed to fetch users', err);
      }
    };
    fetch();
  }, []);

  return (
    <div className="container">
      <h2>Master Dashboard</h2>
      <ul>
        {users.map(u => (
          <li key={u.user_id}>{u.username} ({u.role})</li>
        ))}
      </ul>
    </div>
  );
}
