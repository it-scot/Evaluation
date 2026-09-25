import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export default function UserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select a CSV file first.');
      return;
    }

    setLoading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = await user.getIdToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/users/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(`Success: ${data.message} (${data.count} users)`);
        fetchUsers();
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage("Failed to upload file. Check if the server is running.");
    } finally {
      setLoading(false);
      setFile(null);
    }
  };

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
      <div className="glass-card mb-6">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">👥</span>
          <h2 className="text-2xl font-bold gradient-text m-0">User Management</h2>
        </div>
        
        <div className="glass-section mb-0">
          <h3 className="text-lg font-bold mb-2" style={{ color: '#e2e8f0' }}>Bulk Import Users</h3>
          <p className="text-xs mb-5" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
            Upload a CSV file containing columns: <span style={{ color: '#a78bfa' }}>name, email, department, designation, role</span>.
            Emails must be @scot.lk.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileChange}
              className="flex-1"
            />
            <button 
              onClick={handleUpload} 
              disabled={loading || !file}
              className="btn-primary whitespace-nowrap disabled:opacity-50"
            >
              {loading ? '⏳ Uploading...' : '📤 Upload CSV'}
            </button>
          </div>
          {message && (
            <div className="message-box mt-4">
              {message}
            </div>
          )}
        </div>
      </div>

      <div className="glass-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold m-0" style={{ color: '#e2e8f0' }}>Registered Users</h3>
          <span className="badge badge-info">{users.length} users</span>
        </div>
        <div className="overflow-x-auto" style={{ borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Designation</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="font-semibold" style={{ color: '#e2e8f0' }}>{u.name}</td>
                  <td style={{ color: '#a78bfa' }}>{u.email}</td>
                  <td><span className="badge badge-info capitalize">{u.role}</span></td>
                  <td>{u.department}</td>
                  <td>{u.designation}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-10" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>
                    <div className="text-3xl mb-2">👤</div>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
