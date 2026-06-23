import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Table, TableBody, TableCell, TableHead, TableRow, Button, Chip } from '@mui/material';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const fetchDocs = async () => {
    const res = await axios.get('/api/documents');
    setDocuments(res.data);
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const getColor = (type) => {
    switch (type) {
      case 'urgent':
        return 'error';
      case 'alert':
        return 'warning';
      case 'reminder':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Your Documents
      </Typography>
      <Button variant="contained" onClick={() => navigate('/documents/new')} sx={{ mr: 2 }}>
        Add Document
      </Button>
      <Button variant="outlined" onClick={logout} sx={{ mr: 2 }}>
        Logout
      </Button>
      <Button variant="outlined" onClick={() => navigate('/notifications')} sx={{ mr: 2 }}>
        View Notifications
      </Button>
      <Button variant="outlined" onClick={() => navigate('/master')} sx={{ mr: 2 }}>
        Master View
      </Button>
      <Table sx={{ mt: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Expires</TableCell>
            <TableCell>Days Until Expiration</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.doc_id}>
              <TableCell>{doc.name}</TableCell>
              <TableCell>{doc.type}</TableCell>
              <TableCell>{new Date(doc.expiration_date).toLocaleDateString()}</TableCell>
              <TableCell>{doc.days_until_expiration}</TableCell>
              <TableCell>
                <Chip label={doc.notification_type} color={getColor(doc.notification_type)} />
              </TableCell>
              <TableCell>
                <Button size="small" onClick={() => navigate(`/documents/${doc.doc_id}/upload`)}>
                  Upload File
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Container>
  );
}
