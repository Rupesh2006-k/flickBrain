import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  RiSearchLine,
  RiVipCrownLine,
  RiDeleteBinLine,
  RiArrowRightLine,
  RiArrowLeftLine,
  RiCheckLine,
  RiCloseLine,
  RiEyeLine
} from 'react-icons/ri'
import api from '../../api/axios'
import useToast from '../../hooks/useToast'
import LoadingSpinner from '../../components/LoadingSpinner'

const AdminUsers = () => {
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Delete Confirm Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const { showToast } = useToast()

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/admin/users')
      const data = Array.isArray(response.data)
        ? response.data
        : (response.data.users || [])
      setUsers(data)
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to fetch user directory'
      showToast(errorMsg, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'User Directory - FlickBrain'
    fetchUsers()
  }, [])

  // Toggle user subscription plan (Upgrade / Downgrade)
  const handleTogglePlan = async (id, currentPlan) => {
    const nextPlan = currentPlan?.toLowerCase() === 'premium' ? 'free' : 'premium'
    
    // Optimistic Update
    setUsers((prev) =>
      prev.map((u) => (u._id === id ? { ...u, plan: nextPlan } : u))
    )

    try {
      await api.patch(`/admin/users/${id}/plan`, { plan: nextPlan })
      showToast(`User successfully updated to ${nextPlan.toUpperCase()}`, 'success')
    } catch (err) {
      // Revert on error
      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, plan: currentPlan } : u))
      )
      const errorMsg = err.response?.data?.message || 'Failed to update user plan'
      showToast(errorMsg, 'error')
    }
  }

  // Delete User Confirm Flow
  const openDeleteModal = (user) => {
    setUserToDelete(user)
    setDeleteModalOpen(true)
  }

  const closeDeleteModal = () => {
    setUserToDelete(null)
    setDeleteModalOpen(false)
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return
    setIsDeleting(true)

    try {
      await api.delete(`/admin/users/${userToDelete._id}`)
      setUsers((prev) => prev.filter((u) => u._id !== userToDelete._id))
      showToast('User soft deleted successfully', 'success')
      closeDeleteModal()
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to delete user'
      showToast(errorMsg, 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  // Client side filter
  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase()
    return (
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    )
  })

  // Pagination Math
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage))
  
  // Reset pagination if search queries shrink the list
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage)

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="border-b border-[#1e1e2e] pb-5">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          User Directory
        </h1>
        <p className="text-[#94a3b8] text-sm mt-1">
          Manage system users, toggle accounts subscription levels, or delete records.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#13131a] p-4 rounded-xl border border-[#1e1e2e]">
        <div className="relative w-full sm:max-w-md">
          <RiSearchLine className="absolute left-3 top-3.5 text-[#475569] w-5 h-5" />
          <input
            type="text"
            className="input-field pl-10 py-2.5"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="text-xs text-[#94a3b8] font-semibold bg-[#0a0a0f] border border-[#1e1e2e] px-3.5 py-2 rounded-lg">
          Showing {filteredUsers.length} of {users.length} Users
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-[#13131a] border border-[#1e1e2e] rounded-xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1e1e2e] bg-[#0a0a0f] text-[#94a3b8] text-xs font-semibold uppercase tracking-wider select-none">
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Plan</th>
                <th className="p-4">Role</th>
                <th className="p-4">Joined</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e2e] text-sm">
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((u) => {
                  const isPremium = u.plan?.toLowerCase() === 'premium'
                  const isAdmin = u.role?.toLowerCase() === 'admin'
                  
                  return (
                    <tr key={u._id} className="hover:bg-white/[0.01] transition-colors">
                      {/* Name */}
                      <td className="p-4 font-semibold text-white">
                        {u.name}
                      </td>
                      
                      {/* Email */}
                      <td className="p-4 text-slate-300">
                        {u.email}
                      </td>
                      
                      {/* Plan Badge */}
                      <td className="p-4">
                        {isPremium ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500/20 to-yellow-400/20 text-amber-400 border border-amber-500/30">
                            <RiVipCrownLine className="w-3.5 h-3.5 text-amber-400" />
                            Premium
                          </span>
                        ) : (
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                            Free
                          </span>
                        )}
                      </td>
                      
                      {/* Role Badge */}
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                          isAdmin 
                            ? 'bg-[#7c3aed]/10 text-[#c084fc] border border-[#7c3aed]/20' 
                            : 'bg-slate-800/40 text-slate-400 border border-transparent'
                        }`}>
                          {u.role || 'user'}
                        </span>
                      </td>
                      
                      {/* Joined Date */}
                      <td className="p-4 text-xs text-[#94a3b8]">
                        {formatDate(u.createdAt)}
                      </td>
                      
                      {/* Actions */}
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* Toggle Subscription */}
                          <button
                            onClick={() => handleTogglePlan(u._id, u.plan)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                              isPremium
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                                : 'bg-[#7c3aed]/10 hover:bg-[#7c3aed]/20 text-[#c084fc] border-[#7c3aed]/30'
                            }`}
                            title={isPremium ? 'Downgrade Plan' : 'Upgrade Plan'}
                          >
                            {isPremium ? 'Downgrade' : 'Upgrade'}
                          </button>
                          
                          {/* View details */}
                          <Link
                            to={`/admin/users/${u._id}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-[#1e1e2e] transition-all"
                            title="Inspect User Details"
                          >
                            <RiEyeLine className="w-4 h-4" />
                          </Link>

                          {/* Delete */}
                          <button
                            onClick={() => openDeleteModal(u)}
                            className="p-1.5 rounded-lg text-[#475569] hover:text-[#ef4444] hover:bg-rose-950/20 border border-transparent hover:border-rose-900/30 transition-all cursor-pointer"
                            title="Soft Delete User"
                          >
                            <RiDeleteBinLine className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-[#94a3b8]">
                    No users matching search filters found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="bg-[#0a0a0f] border-t border-[#1e1e2e] p-4 flex items-center justify-between">
            <span className="text-xs text-[#94a3b8]">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-[#1e1e2e] bg-[#13131a] hover:bg-[#1e1e2e] text-[#94a3b8] hover:text-white disabled:opacity-50 transition-all cursor-pointer"
              >
                <RiArrowLeftLine className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-[#1e1e2e] bg-[#13131a] hover:bg-[#1e1e2e] text-[#94a3b8] hover:text-white disabled:opacity-50 transition-all cursor-pointer"
              >
                <RiArrowRightLine className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#13131a] border border-[#1e1e2e] rounded-xl shadow-2xl p-6 relative animate-slide-in pointer-events-auto">
            {/* Close */}
            <button
              onClick={closeDeleteModal}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <RiCloseLine className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-2">Delete User Record</h3>
            <p className="text-sm text-[#94a3b8] leading-relaxed mb-6">
              Are you sure you want to soft delete <span className="text-white font-semibold">{userToDelete.name}</span> (<span className="text-slate-300 font-mono text-xs">{userToDelete.email}</span>)? This will deactivate their login sessions and mark the account record as suspended.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="px-4 py-2 border border-[#1e1e2e] text-slate-300 hover:bg-slate-800 rounded-lg text-sm transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="px-4 py-2 bg-[#ef4444] hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    <span>Suspending...</span>
                  </>
                ) : (
                  <span>Deactivate User</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUsers
