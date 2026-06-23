import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function DocumentForm() {
  const [form, setForm] = useState({
    name: '',
    type: '',
    category: '',
    expiration_date: '',
    renewal_due_days: 30,
  });
  const navigate = useNavigate();

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await axios.post('/api/documents', form);
      navigate('/');
    } catch (err) {
      console.error('Error creating document', err);
    }
  };

  return (
    <div className="container">
      <h2>Create New Document</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input name="name" value={form.name} onChange={handleChange} required />
        </div>
        <div>
          <label>Type:</label>
          <input name="type" value={form.type} onChange={handleChange} required />
        </div>
        <div>
          <label>Category:</label>
          <input name="category" value={form.category} onChange={handleChange} />
        </div>
        <div>
          <label>Expiration Date:</label>
          <input type="date" name="expiration_date" value={form.expiration_date} onChange={handleChange} required />
        </div>
        <div>
          <label>Renewal Due Days:</label>
          <input type="number" name="renewal_due_days" value={form.renewal_due_days} onChange={handleChange} />
        </div>
        <button type="submit">Create</button>
      </form>
    </div>
  );
}
