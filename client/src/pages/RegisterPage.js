import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TextField, Button, Container, Typography, Box, MenuItem } from '@mui/material';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    username: '',
    password: '',
    email: '',
    phone: '',
    role: 'user',
  });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Registration failed');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">Register</Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, width: '100%' }}>
          <TextField fullWidth margin="normal" label="Username" name="username" required value={form.username} onChange={handleChange} />
          <TextField fullWidth margin="normal" label="Password" name="password" type="password" required value={form.password} onChange={handleChange} />
          <TextField fullWidth margin="normal" label="Email" name="email" type="email" required value={form.email} onChange={handleChange} />
          <TextField fullWidth margin="normal" label="Phone (optional)" name="phone" value={form.phone} onChange={handleChange} />
          <TextField fullWidth margin="normal" select label="Role" name="role" value={form.role} onChange={handleChange}>
            <MenuItem value="user">User</MenuItem>
            <MenuItem value="master">Master (admin)</MenuItem>
          </TextField>
          {error && <Typography color="error" variant="body2">{error}</Typography>}
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
            Register
          </Button>
          <Button fullWidth variant="text" onClick={() => navigate('/login')}>
            Back to Login
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
