import { useState, useEffect } from 'react'
import axios from 'axios'

axios.defaults.xsrfCookieName = 'csrftoken'
axios.defaults.xsrfHeaderName = 'X-CSRFToken'
axios.defaults.withCredentials = false

const API_URL = import.meta.env.VITE_API_URL

function App() {
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

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      const res = await axios.get(API_URL)
      const data = res.data
      // handle both array and paginated response
      setExpenses(Array.isArray(data) ? data : data.results || [])
      setLoading(false)
    } catch (err) {
      showToast('Failed to fetch expenses', 'error')
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
      if (editingExpense) {
        await axios.put(`${API_URL}${editingExpense.id}/`, form)
        showToast('Expense updated successfully!')
      } else {
        await axios.post(API_URL, form)
        showToast('Expense added successfully!')
      }
      setForm({ title: '', amount: '', category: '', date: '' })
      setShowForm(false)
      setEditingExpense(null)
      fetchExpenses()
    } catch (err) {
      showToast('Something went wrong', 'error')
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
      await axios.delete(`${API_URL}${id}/`)
      showToast('Expense deleted successfully!')
      fetchExpenses()
    } catch (err) {
      showToast('Failed to delete expense', 'error')
    }
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

      {/* Header */}
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Expense Tracker</h1>
            <p className="text-gray-400 mt-1">Track your spending clearly</p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setEditingExpense(null); setForm({ title: '', amount: '', category: '', date: '' }) }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-lg transition"
          >
            {showForm ? 'Cancel' : '+ Add Expense'}
          </button>
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
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Coffee"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Amount (₹)</label>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. 150"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Category</label>
                <input
                  type="text"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Food"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Date</label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition"
                >
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
                      <button
                        onClick={() => handleEdit(expense)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs px-3 py-1.5 rounded-lg transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-lg transition"
                      >
                        Delete
                      </button>
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

export default App