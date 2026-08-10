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
      // Adjust the port/URL based on your environment
      const response = await fetch('http://localhost:5000/api/users/upload', {
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
    <div className="card">
      <h2 className="mb-6">User Management</h2>
      
      <div className="mb-8 bg-gray-50 p-4 border border-gray-200">
        <h3 className="mb-2 text-lg">Bulk Import Users</h3>
        <p className="text-sm text-gray-500 mb-4">
          Upload a CSV file containing columns: name, email, department, designation, role.
          Emails must be @scot.lk.
        </p>
        <div className="flex gap-4 items-center">
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleFileChange}
            className="flex-1 bg-white"
          />
          <button 
            onClick={handleUpload} 
            disabled={loading || !file}
            className="btn-primary whitespace-nowrap disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Upload CSV'}
          </button>
        </div>
        {message && <div className="mt-4 text-sm font-medium">{message}</div>}
      </div>

      <div>
        <h3 className="mb-4 text-lg">Registered Users</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 uppercase tracking-wider text-xs">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Department</th>
                <th className="p-3">Designation</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3">{u.name}</td>
                  <td className="p-3 font-medium">{u.email}</td>
                  <td className="p-3 capitalize">{u.role}</td>
                  <td className="p-3">{u.department}</td>
                  <td className="p-3">{u.designation}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-gray-500">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
