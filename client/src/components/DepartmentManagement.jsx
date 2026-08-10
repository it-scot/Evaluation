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
    <div className="card">
      <h2 className="mb-6">Department Management</h2>
      
      <div className="mb-8 bg-gray-50 p-6 border border-gray-200">
        <h3 className="mb-4 text-lg">Add New Department</h3>
        <form onSubmit={handleAdd} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium mb-1">Department Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2">
                <input 
                  type="radio" 
                  name="category" 
                  value="Academic" 
                  checked={category === 'Academic'}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-auto"
                />
                Academic
              </label>
              <label className="flex items-center gap-2">
                <input 
                  type="radio" 
                  name="category" 
                  value="Non-Academic" 
                  checked={category === 'Non-Academic'}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-auto"
                />
                Non-Academic
              </label>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary mt-4">
            {loading ? 'Saving...' : 'Save Department'}
          </button>
        </form>
      </div>

      <div>
        <h3 className="mb-4 text-lg">Existing Departments</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 uppercase tracking-wider text-xs">
              <tr>
                <th className="p-3">Department Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Category</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((d) => (
                <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-medium">{d.name}</td>
                  <td className="p-3">{d.email}</td>
                  <td className="p-3">{d.category}</td>
                </tr>
              ))}
              {departments.length === 0 && (
                <tr>
                  <td colSpan="3" className="p-6 text-center text-gray-500">No departments added.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
