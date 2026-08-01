import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiX, FiUserCheck } from 'react-icons/fi';
import * as authService from '../services/authService';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const EMPTY_FORM = { name: '', email: '', password: '' };

const ManageWorkers = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const res = await authService.getWorkers();
      setWorkers(res.workers);
    } catch (err) {
      toast.error('Failed to load worker accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authService.createWorker(form);
      toast.success('Worker account created');
      setShowModal(false);
      setForm(EMPTY_FORM);
      fetchWorkers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create worker account');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Counter Staff</h1>
          <p className="text-gray-500 mt-1">Worker accounts for the QR scanner and kitchen queue.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <FiPlus size={18} /> Add Worker
        </button>
      </div>

      <div className="mt-6 card overflow-x-auto">
        {loading ? (
          <div className="p-10"><LoadingSpinner fullScreen /></div>
        ) : workers.length === 0 ? (
          <EmptyState
            icon={FiUserCheck}
            title="No worker accounts yet"
            message="Add one so counter staff can log in to scan pickup QR codes."
          />
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Name</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Email</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {workers.map((w) => (
                <tr key={w._id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{w.name}</td>
                  <td className="px-4 py-3 text-gray-600">{w.email}</td>
                  <td className="px-4 py-3 text-gray-500 text-sm">{new Date(w.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <FiX size={20} />
            </button>
            <h2 className="text-lg font-bold text-gray-900">Add Worker</h2>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input name="name" value={form.name} onChange={handleChange} required className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input name="password" type="password" value={form.password} onChange={handleChange} required minLength={6} className="input-field" />
              </div>
              <button type="submit" disabled={saving} className="btn-primary w-full mt-2">
                {saving ? 'Creating...' : 'Create Worker Account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageWorkers;
