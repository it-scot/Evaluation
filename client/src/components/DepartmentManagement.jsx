import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('Academic');
  const [loading, setLoading] = useState(false);

  const fetchDepartments = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'departments'));
      const deptData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDepartments(deptData);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name || !email) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'departments'), {
        name,
        email,
        category
      });
      setName('');
      setEmail('');
      fetchDepartments();
    } catch (error) {
      console.error("Error adding department", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
      <div className="glass-card mb-6">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">🏢</span>
          <h2 className="text-2xl font-bold gradient-text m-0">Department Management</h2>
        </div>
        
        <div className="glass-section">
          <h3 className="text-lg font-bold mb-4" style={{ color: '#e2e8f0' }}>Add New Department</h3>
          <form onSubmit={handleAdd} className="space-y-5 max-w-lg">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#c4b5fd' }}>Department Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Computer Science"
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#c4b5fd' }}>Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="department@scot.lk"
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: '#c4b5fd' }}>Category</label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="category" 
                    value="Academic" 
                    checked={category === 'Academic'}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-auto"
                  />
                  <span className="text-sm font-medium" style={{ color: category === 'Academic' ? '#c4b5fd' : 'rgba(255,255,255,0.5)' }}>
                    Academic
                  </span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="category" 
                    value="Non-Academic" 
                    checked={category === 'Non-Academic'}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-auto"
                  />
                  <span className="text-sm font-medium" style={{ color: category === 'Non-Academic' ? '#c4b5fd' : 'rgba(255,255,255,0.5)' }}>
                    Non-Academic
                  </span>
                </label>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary mt-2">
              {loading ? '⏳ Saving...' : '💾 Save Department'}
            </button>
          </form>
        </div>
      </div>

      <div className="glass-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold m-0" style={{ color: '#e2e8f0' }}>Existing Departments</h3>
          <span className="badge badge-info">{departments.length} dept{departments.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="overflow-x-auto" style={{ borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <table>
            <thead>
              <tr>
                <th>Department Name</th>
                <th>Email</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((d) => (
                <tr key={d.id}>
                  <td className="font-semibold" style={{ color: '#e2e8f0' }}>{d.name}</td>
                  <td style={{ color: '#a78bfa' }}>{d.email}</td>
                  <td>
                    <span className={`badge ${d.category === 'Academic' ? 'badge-info' : 'badge-warning'}`}>
                      {d.category}
                    </span>
                  </td>
                </tr>
              ))}
              {departments.length === 0 && (
                <tr>
                  <td colSpan="3" className="text-center py-10" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>
                    <div className="text-3xl mb-2">🏢</div>
                    No departments added.
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
