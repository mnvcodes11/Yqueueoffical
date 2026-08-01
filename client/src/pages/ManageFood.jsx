import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { FiAlertTriangle, FiCheckCircle, FiEdit2, FiPackage, FiPlus, FiSearch, FiTrash2, FiTrendingDown, FiX } from 'react-icons/fi';
import * as foodService from '../services/foodService';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const CATEGORIES = ['Meals', 'Snacks', 'Drinks', 'Desserts'];
const EMPTY_FORM = { name: '', description: '', category: 'Meals', price: '', image: '', available: true, stock: '' };

const ManageFood = () => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const summary = React.useMemo(() => {
    const totalItems = foods.length;
    const availableItems = foods.filter((food) => food.available).length;
    const trackedItems = foods.filter((food) => food.stock !== null && food.stock !== undefined).length;
    const lowStock = foods.filter((food) => food.stock !== null && food.stock !== undefined && food.stock <= 5).length;
    const outOfStock = foods.filter((food) => food.stock === 0).length;
    const totalValue = foods.reduce((sum, food) => sum + (Number(food.price) || 0) * (Number(food.stock) || 0), 0);

    return {
      totalItems,
      availableItems,
      trackedItems,
      lowStock,
      outOfStock,
      totalValue,
    };
  }, [foods]);

  const fetchFoods = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      const res = await foodService.getFoods(params);
      setFoods(res.foods);
    } catch (err) {
      toast.error('Failed to load food items.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const debounce = setTimeout(fetchFoods, 300);
    return () => clearTimeout(debounce);
  }, [fetchFoods]);

  const openCreateModal = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowModal(true);
  };

  const openEditModal = (food) => {
    setForm({
      name: food.name,
      description: food.description,
      category: food.category,
      price: food.price,
      image: food.image,
      available: food.available,
      stock: food.stock === null || food.stock === undefined ? '' : food.stock,
    });
    setEditingId(food._id);
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price) };
      if (editingId) {
        await foodService.updateFood(editingId, payload);
        toast.success('Food item updated');
      } else {
        await foodService.createFood(payload);
        toast.success('Food item created');
      }
      setShowModal(false);
      fetchFoods();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (food) => {
    if (!window.confirm(`Delete "${food.name}"? This cannot be undone.`)) return;
    try {
      await foodService.deleteFood(food._id);
      toast.success('Food item deleted');
      fetchFoods();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete item');
    }
  };

  const toggleAvailability = async (food) => {
    try {
      await foodService.updateFood(food._id, { available: !food.available });
      fetchFoods();
    } catch (err) {
      toast.error('Could not update availability');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900/90 to-primary-950/70 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Inventory Command Center</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Run your campus kitchen like a premium food-tech operation.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">Track stock health, surface low inventory, and keep every menu item available for students without friction.</p>
          </div>
          <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
            <FiPlus size={18} /> Add Menu Item
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Menu Items', value: summary.totalItems, icon: FiPackage, tone: 'text-primary-200' },
            { label: 'Available Now', value: summary.availableItems, icon: FiCheckCircle, tone: 'text-emerald-300' },
            { label: 'Low Stock', value: summary.lowStock, icon: FiAlertTriangle, tone: 'text-amber-300' },
            { label: 'Out of Stock', value: summary.outOfStock, icon: FiTrendingDown, tone: 'text-rose-300' },
          ].map(({ label, value, icon: Icon, tone }) => (
            <div key={label} className="rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">{label}</p>
                <div className={`rounded-2xl bg-white/10 p-2 ${tone}`}>
                  <Icon size={16} />
                </div>
              </div>
              <p className="mt-4 text-3xl font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative max-w-md">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search food, category, or status..." className="input-field pl-10" />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-10"><LoadingSpinner fullScreen /></div>
        ) : foods.length === 0 ? (
          <EmptyState title="No food items yet" message="Add your first item to get started." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-slate-950/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {foods.map((food) => {
                  const stockState = food.stock === null || food.stock === undefined
                    ? 'Unlimited'
                    : food.stock <= 0
                      ? 'Out of stock'
                      : food.stock <= 5
                        ? 'Low stock'
                        : 'Healthy';

                  return (
                    <tr key={food._id} className="bg-slate-900/40">
                      <td className="px-4 py-3 font-medium text-white">{food.name}</td>
                      <td className="px-4 py-3 text-slate-400">{food.category}</td>
                      <td className="px-4 py-3 text-slate-300">₹{food.price}</td>
                      <td className="px-4 py-3 text-slate-300">
                        {food.stock === null || food.stock === undefined ? (
                          <span className="text-slate-400">Unlimited</span>
                        ) : (
                          <span className={food.stock <= 5 ? 'text-amber-300' : 'text-white'}>{food.stock}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleAvailability(food)}
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            food.available
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {food.available ? 'Available' : 'Unavailable'}
                        </button>
                        <span className="ml-2 text-xs text-slate-500">{stockState}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => openEditModal(food)} className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-primary-200">
                          <FiEdit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(food)} className="ml-2 rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-rose-300">
                          <FiTrash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="card relative w-full max-w-md p-6">
            <button onClick={() => setShowModal(false)} className="absolute right-4 top-4 text-slate-400 hover:text-white">
              <FiX size={20} />
            </button>
            <h2 className="text-lg font-semibold text-white">{editingId ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
            <p className="mt-1 text-sm text-slate-400">Keep stock, availability, and pricing aligned with the live order flow.</p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Name</label>
                <input name="name" value={form.name} onChange={handleChange} required className="input-field" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={2} className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Category</label>
                  <select name="category" value={form.category} onChange={handleChange} className="input-field">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Price (₹)</label>
                  <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} required className="input-field" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Image URL</label>
                <input name="image" value={form.image} onChange={handleChange} placeholder="https://..." className="input-field" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">
                  Stock <span className="font-normal text-slate-500">(leave blank = unlimited)</span>
                </label>
                <input name="stock" type="number" min="0" step="1" value={form.stock} onChange={handleChange} placeholder="Unlimited" className="input-field" />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" name="available" checked={form.available} onChange={handleChange} />
                Available for ordering
              </label>
              <button type="submit" disabled={saving} className="btn-primary mt-2 w-full">
                {saving ? 'Saving...' : editingId ? 'Update Menu Item' : 'Create Menu Item'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageFood;
