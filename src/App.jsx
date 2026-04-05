import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Login from './pages/Login'
import Register from './pages/Register'

axios.defaults.xsrfCookieName = 'csrftoken'
axios.defaults.xsrfHeaderName = 'X-CSRFToken'
axios.defaults.withCredentials = false

const API_URL = import.meta.env.VITE_API_URL

// ── This is your main app, now wrapped in auth checks ──
function Dashboard() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [toast, setToast] = useState(null)
  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: '',
    date: ''
  })
  const navigate = useNavigate()

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const res = await axios.get(`${API_URL}/api/expenses/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = res.data
      setExpenses(Array.isArray(data) ? data : data.results || [])
      setLoading(false)
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login')  // token expired or invalid → send to login
      } else {
        showToast('Failed to fetch expenses', 'error')
      }
      setLoading(false)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('access_token')
      const headers = { Authorization: `Bearer ${token}` }
      if (editingExpense) {
        await axios.put(`${API_URL}/api/expenses/${editingExpense.id}/`, form, { headers })
        showToast('Expense updated successfully!')
      } else {
        await axios.post(`${API_URL}/api/expenses/`, form, { headers })
        showToast('Expense added successfully!')
      }
      setForm({ title: '', amount: '', category: '', date: '' })
      setShowForm(false)
      setEditingExpense(null)
      fetchExpenses()
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login')
      } else {
        showToast('Something went wrong', 'error')
      }
    }
  }

  const handleEdit = (expense) => {
    setEditingExpense(expense)
    setForm({
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      date: expense.date
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return
    try {
      const token = localStorage.getItem('access_token')
      await axios.delete(`${API_URL}/api/expenses/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      showToast('Expense deleted successfully!')
      fetchExpenses()
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login')
      } else {
        showToast('Failed to delete expense', 'error')
      }
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    navigate('/login')
  }

  const getCategoryTotals = () => {
    const totals = {}
    expenses.forEach(exp => {
      totals[exp.category] = (totals[exp.category] || 0) + parseFloat(exp.amount)
    })
    return totals
  }

  const getTotalSpent = () => {
    return expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0).toFixed(2)
  }

  const categoryTotals = getCategoryTotals()

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 font-medium transition-all ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {toast.message}
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Expense Tracker</h1>
            <p className="text-gray-400 mt-1">Track your spending clearly</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setShowForm(!showForm); setEditingExpense(null); setForm({ title: '', amount: '', category: '', date: '' }) }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-lg transition"
            >
              {showForm ? 'Cancel' : '+ Add Expense'}
            </button>
            <button
              onClick={handleLogout}
              className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-5 py-2.5 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 rounded-xl p-4 col-span-2 md:col-span-1">
            <p className="text-gray-400 text-sm">Total Spent</p>
            <p className="text-2xl font-bold text-indigo-400 mt-1">₹{getTotalSpent()}</p>
          </div>
          {Object.entries(categoryTotals).map(([category, total]) => (
            <div key={category} className="bg-gray-900 rounded-xl p-4">
              <p className="text-gray-400 text-sm">{category}</p>
              <p className="text-2xl font-bold text-white mt-1">₹{total.toFixed(2)}</p>
            </div>
          ))}
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-gray-900 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">{editingExpense ? 'Edit Expense' : 'Add New Expense'}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Title</label>
                <input type="text" name="title" value={form.title} onChange={handleChange} required
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Coffee" />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Amount (₹)</label>
                <input type="number" name="amount" value={form.amount} onChange={handleChange} required
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. 150" />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Category</label>
                <select name="category" value={form.category} onChange={handleChange} required
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select a category</option>
                  <option value="Food">Food</option>
                  <option value="Transport">Transport</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Health">Health</option>
                  <option value="Education">Education</option>
                  <option value="Bills">Bills</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Date</label>
                <input type="date" name="date" value={form.date} onChange={handleChange} required
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="md:col-span-2">
                <button type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition">
                  {editingExpense ? 'Update Expense' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Expenses Table */}
        <div className="bg-gray-900 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="font-semibold text-lg">All Expenses</h2>
          </div>
          {loading ? (
            <p className="text-gray-400 text-center py-10">Loading...</p>
          ) : expenses.length === 0 ? (
            <p className="text-gray-400 text-center py-10">No expenses yet. Add one!</p>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-800 text-gray-400 text-sm">
                <tr>
                  <th className="text-left px-4 py-3">Title</th>
                  <th className="text-left px-4 py-3">Category</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Amount</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(expense => (
                  <tr key={expense.id} className="border-t border-gray-800 hover:bg-gray-800 transition">
                    <td className="px-4 py-3">{expense.title}</td>
                    <td className="px-4 py-3">
                      <span className="bg-indigo-900 text-indigo-300 text-xs px-2 py-1 rounded-full">{expense.category}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{expense.date}</td>
                    <td className="px-4 py-3 font-semibold text-green-400">₹{parseFloat(expense.amount).toFixed(2)}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button onClick={() => handleEdit(expense)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs px-3 py-1.5 rounded-lg transition">Edit</button>
                      <button onClick={() => handleDelete(expense.id)}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-lg transition">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// ── This is the root component — handles routing ──
export default function App() {
  const isLoggedIn = !!localStorage.getItem('access_token')

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" />}
        />
      </Routes>
    </BrowserRouter>
  )
}