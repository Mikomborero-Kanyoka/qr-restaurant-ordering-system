import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { getCurrentUserContext, STAFF_SIGNUP_ROLE, subscribeToUserContext } from '../authProfile'
import { Plus, Users, Building, ChevronRight, Store, X, Zap, GitBranch } from 'lucide-react'

if (!document.querySelector('[data-ad-fonts]')) {
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = 'https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800;900&family=DM+Sans:wght@300;400;500&display=swap'
  link.setAttribute('data-ad-fonts', '')
  document.head.appendChild(link)

  const style = document.createElement('style')
  style.setAttribute('data-ad-styles', '')
  style.textContent = `
    .font-syne { font-family: 'Syne', sans-serif !important; }
    .font-dm   { font-family: 'DM Sans', sans-serif !important; }

    @keyframes ad-fadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes ad-scaleIn {
      from { opacity: 0; transform: scale(0.94); }
      to   { opacity: 1; transform: scale(1); }
    }

    .anim-1 { animation: ad-fadeUp .5s .00s cubic-bezier(.22,1,.36,1) both; }
    .anim-2 { animation: ad-fadeUp .5s .08s cubic-bezier(.22,1,.36,1) both; }
    .anim-3 { animation: ad-fadeUp .5s .16s cubic-bezier(.22,1,.36,1) both; }
    .modal-in { animation: ad-scaleIn .3s cubic-bezier(.22,1,.36,1) both; }

    .branch-card { transition: box-shadow .22s ease, transform .22s ease; }
    .branch-card:hover { box-shadow: 0 12px 40px rgba(0,0,0,.10); transform: translateY(-3px); }

    .emp-card { transition: box-shadow .2s ease, transform .2s ease; }
    .emp-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,.08); transform: translateY(-2px); }

    .add-card { transition: border-color .2s ease, box-shadow .2s ease, transform .2s ease; }
    .add-card:hover { border-color: #FFD600 !important; box-shadow: 0 8px 28px rgba(255,214,0,.15); transform: translateY(-3px); }
    .add-card:hover .add-icon { background: #FFD600 !important; }
    .add-card:hover .add-icon svg { color: #0a0a0a !important; }
  `
  document.head.appendChild(style)
}

const inputCls =
  'w-full px-5 py-4 bg-gray-100 rounded-2xl border-2 border-transparent focus:border-[#FFD600] outline-none font-dm text-base text-[#0a0a0a] transition-all placeholder:text-gray-400'

const selectCls =
  'w-full px-5 py-4 bg-gray-100 rounded-2xl border-2 border-transparent focus:border-[#FFD600] outline-none font-syne font-bold text-sm uppercase text-[#0a0a0a] transition-all'

const Modal = ({ onClose, title, icon, children }) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
    <div className="modal-in bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-black/[0.06] overflow-hidden">
      <div className="bg-[#0a0a0a] px-8 py-7 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFD600] flex items-center justify-center shrink-0">
            {icon}
          </div>
          <h2 className="font-syne text-xl font-extrabold text-white">{title}</h2>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-95"
        >
          <X size={18} />
        </button>
      </div>
      <div className="px-8 py-8">{children}</div>
    </div>
  </div>
)

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [branches, setBranches] = useState([])
  const [employees, setEmployees] = useState([])
  const [newBranch, setNewBranch] = useState({ name: '', address: '' })
  const [showAddBranch, setShowAddBranch] = useState(false)
  const [showAssignBranch, setShowAssignBranch] = useState(false)
  const [activeTab, setActiveTab] = useState('branches')
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [selectedBranchId, setSelectedBranchId] = useState('')

  useEffect(() => {
    let mounted = true

    const loadUser = async () => {
      const context = await getCurrentUserContext()
      if (!mounted) return

      if (!context || context.role !== 'admin') {
        navigate('/login')
        return
      }
    }

    loadUser().catch((error) => {
      console.error('Failed to load admin context', error)
      navigate('/login')
    })

    const {
      data: { subscription },
    } = subscribeToUserContext((context) => {
      if (!context || context.role !== 'admin') {
        navigate('/login')
      }
    })

    fetchBranches()
    fetchEmployees()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [navigate])

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase.from('branches').select('*').order('name')
      if (error) throw error
      setBranches(data ?? [])
    } catch (error) {
      console.error(error)
    }
  }

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase.from('users').select('*').order('username')
      if (error) throw error

      const nonCustomers = (data ?? []).filter((employee) => employee.role !== 'customer')
      setEmployees(nonCustomers)
    } catch (error) {
      console.error(error)
    }
  }

  const handleAddBranch = async (event) => {
    event.preventDefault()

    try {
      const { error } = await supabase.from('branches').insert([newBranch])
      if (error) throw error

      setNewBranch({ name: '', address: '' })
      setShowAddBranch(false)
      fetchBranches()
    } catch (error) {
      console.error(error)
    }
  }

  const openAssignBranch = (employee) => {
    setSelectedEmployee(employee)
    setSelectedBranchId(employee.branch_id ? String(employee.branch_id) : '')
    setShowAssignBranch(true)
  }

  const handleAssignBranch = async (event) => {
    event.preventDefault()

    if (!selectedEmployee) return

    try {
      const payload = {
        branch_id: selectedBranchId ? Number(selectedBranchId) : null,
      }

      if (!selectedEmployee.role) {
        payload.role = STAFF_SIGNUP_ROLE
      }

      const { error } = await supabase
        .from('users')
        .update(payload)
        .eq('id', selectedEmployee.id)

      if (error) throw error

      setShowAssignBranch(false)
      setSelectedEmployee(null)
      setSelectedBranchId('')
      fetchEmployees()
    } catch (error) {
      console.error(error)
      alert(`Failed to update branch assignment: ${error.message}`)
    }
  }

  const branchNameById = useMemo(
    () =>
      Object.fromEntries(
        branches.map((branch) => [branch.id, branch.name])
      ),
    [branches]
  )

  const pendingEmployees = employees.filter((employee) => employee.role !== 'admin' && !employee.branch_id)
  const assignedEmployees = employees.filter((employee) => employee.role !== 'admin' && employee.branch_id)

  return (
    <div className="font-dm min-h-svh bg-[#f2f2f0] pb-24">
      <div className="bg-[#0a0a0a] px-5 pt-12 pb-24 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 opacity-[0.04] rotate-12 pointer-events-none">
          <Store size={240} color="#fff" />
        </div>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="anim-1 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FFD600] flex items-center justify-center shrink-0">
              <Zap size={26} color="#0a0a0a" fill="#0a0a0a" />
            </div>
            <div>
              <p className="font-syne text-xs font-semibold uppercase tracking-widest text-gray-500 mb-0.5">
                FoodApp
              </p>
              <h1 className="font-syne text-2xl font-extrabold text-white leading-tight">
                Admin Central
              </h1>
            </div>
          </div>

          <div className="anim-1 flex items-center gap-2 bg-white/10 p-1.5 rounded-2xl self-start sm:self-auto">
            {[
              { key: 'branches', label: 'Branches', icon: <Building size={16} /> },
              { key: 'employees', label: 'Employees', icon: <Users size={16} /> },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-syne font-bold text-sm uppercase tracking-wide transition-all active:scale-95 ${
                  activeTab === tab.key ? 'bg-[#FFD600] text-[#0a0a0a]' : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-12 space-y-6">
        {activeTab === 'branches' && (
          <div className="anim-2 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <button
              onClick={() => setShowAddBranch(true)}
              className="add-card bg-white rounded-3xl border-2 border-dashed border-gray-200 shadow-sm p-10 flex flex-col items-center justify-center gap-4 cursor-pointer text-center min-h-[200px]"
            >
              <div className="add-icon w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center transition-all">
                <Plus size={28} className="text-gray-400 transition-colors" />
              </div>
              <span className="font-syne text-base font-extrabold text-[#0a0a0a] uppercase tracking-wide">
                Add New Branch
              </span>
            </button>

            {branches.map((branch) => (
              <div
                key={branch.id}
                className="branch-card bg-white rounded-3xl border border-black/[0.06] shadow-sm overflow-hidden relative"
              >
                <div className="h-1.5 bg-[#FFD600] w-full" />
                <div className="absolute top-4 right-4 opacity-[0.06] pointer-events-none">
                  <Building size={80} />
                </div>

                <div className="p-7 flex flex-col gap-5">
                  <div>
                    <h2 className="font-syne text-xl font-extrabold text-[#0a0a0a] leading-snug mb-1">
                      {branch.name}
                    </h2>
                    <p className="font-dm text-sm text-gray-400 leading-relaxed">{branch.address}</p>
                  </div>
                  <button
                    onClick={() => navigate(`/branch/${branch.id}`)}
                    className="flex items-center justify-between w-full px-5 py-4 bg-[#0a0a0a] text-white rounded-2xl font-syne font-bold text-sm uppercase tracking-wide hover:bg-gray-800 active:scale-95 transition-all"
                  >
                    Manage Branch <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'employees' && (
          <div className="anim-2 space-y-5">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-3xl border border-black/[0.06] shadow-sm px-6 py-5">
                <p className="font-syne text-xs font-bold uppercase tracking-widest text-gray-400">Total staff</p>
                <p className="font-syne text-3xl font-black text-[#0a0a0a] mt-3">{employees.length}</p>
              </div>
              <div className="bg-white rounded-3xl border border-black/[0.06] shadow-sm px-6 py-5">
                <p className="font-syne text-xs font-bold uppercase tracking-widest text-gray-400">Waiting for branch</p>
                <p className="font-syne text-3xl font-black text-[#0a0a0a] mt-3">{pendingEmployees.length}</p>
              </div>
              <div className="bg-white rounded-3xl border border-black/[0.06] shadow-sm px-6 py-5">
                <p className="font-syne text-xs font-bold uppercase tracking-widest text-gray-400">Assigned to branches</p>
                <p className="font-syne text-3xl font-black text-[#0a0a0a] mt-3">{assignedEmployees.length}</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-black/[0.06] shadow-sm p-6">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h2 className="font-syne text-2xl font-black text-[#0a0a0a] tracking-tight">
                    Staff Directory
                  </h2>
                  <p className="font-dm text-sm text-gray-400 mt-1">
                    Staff create accounts first. Admin assigns their branch here, then the branch manager gives them a working role.
                  </p>
                </div>
                <div className="font-syne text-xs font-bold uppercase tracking-wider bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full shrink-0">
                  Branch assignment only
                </div>
              </div>

              <div className="space-y-3">
                {employees.map((employee) => {
                  const branchName = employee.branch_id ? branchNameById[employee.branch_id] : null
                  const isAdmin = employee.role === 'admin'

                  return (
                    <div
                      key={employee.id}
                      className="emp-card bg-[#fafaf8] rounded-3xl border border-black/[0.05] overflow-hidden relative flex items-center gap-5 pl-6 pr-6 py-6"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#FFD600] rounded-l-3xl" />

                      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center shrink-0">
                        <Users size={26} className="text-[#0a0a0a]" strokeWidth={1.5} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-syne text-lg font-extrabold text-[#0a0a0a] leading-snug">
                          {employee.username || employee.email}
                        </p>
                        <p className="font-dm text-sm text-gray-400 mt-0.5">{employee.email}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <span className="font-syne text-[11px] font-bold uppercase tracking-wide bg-black/5 text-[#0a0a0a] px-3 py-1.5 rounded-full">
                            {employee.role || STAFF_SIGNUP_ROLE}
                          </span>
                          <span className={`font-syne text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full ${branchName ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {branchName || 'Unassigned'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => openAssignBranch(employee)}
                        disabled={isAdmin}
                        className={`font-syne text-xs font-bold uppercase tracking-wide px-5 py-3 rounded-2xl transition-all shrink-0 ${
                          isAdmin
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-[#FFD600] text-[#0a0a0a] hover:-translate-y-0.5 active:scale-95'
                        }`}
                      >
                        {branchName ? 'Reassign Branch' : 'Assign Branch'}
                      </button>
                    </div>
                  )
                })}

                {employees.length === 0 && (
                  <div className="text-center py-20 bg-[#fafaf8] rounded-3xl border border-dashed border-gray-200">
                    <p className="font-syne text-gray-400 font-bold uppercase tracking-widest">
                      No staff profiles yet
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showAssignBranch && selectedEmployee && (
        <Modal
          onClose={() => setShowAssignBranch(false)}
          title="Assign Branch"
          icon={<GitBranch size={18} color="#0a0a0a" />}
        >
          <form onSubmit={handleAssignBranch} className="space-y-5">
            <div className="space-y-2">
              <label className="font-syne text-xs font-bold uppercase tracking-wider text-gray-400">Staff member</label>
              <div className="rounded-2xl bg-gray-100 px-5 py-4">
                <p className="font-syne text-base font-extrabold text-[#0a0a0a]">
                  {selectedEmployee.username || selectedEmployee.email}
                </p>
                <p className="font-dm text-sm text-gray-400 mt-1">{selectedEmployee.email}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-syne text-xs font-bold uppercase tracking-wider text-gray-400">Assigned branch</label>
              <select
                className={selectCls}
                value={selectedBranchId}
                onChange={(event) => setSelectedBranchId(event.target.value)}
              >
                <option value="">Remove branch assignment</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-400">
                After a branch is assigned, that branch manager can assign the employee&apos;s role.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAssignBranch(false)}
                className="flex-1 py-4 bg-gray-100 text-[#0a0a0a] font-syne font-bold uppercase text-sm rounded-2xl hover:bg-gray-200 active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-4 bg-[#FFD600] text-[#0a0a0a] font-syne font-extrabold uppercase text-sm rounded-2xl shadow-[0_4px_16px_rgba(255,214,0,.3)] hover:-translate-y-0.5 active:scale-95 transition-all"
              >
                Save Assignment
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showAddBranch && (
        <Modal
          onClose={() => setShowAddBranch(false)}
          title="Create Branch"
          icon={<Building size={18} color="#0a0a0a" />}
        >
          <form onSubmit={handleAddBranch} className="space-y-5">
            <div className="space-y-2">
              <label className="font-syne text-xs font-bold uppercase tracking-wider text-gray-400">Branch Name</label>
              <input
                type="text"
                className={inputCls}
                placeholder="e.g. Downtown Location"
                value={newBranch.name}
                onChange={(event) => setNewBranch({ ...newBranch, name: event.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="font-syne text-xs font-bold uppercase tracking-wider text-gray-400">Address</label>
              <input
                type="text"
                className={inputCls}
                placeholder="e.g. 123 Main Street"
                value={newBranch.address}
                onChange={(event) => setNewBranch({ ...newBranch, address: event.target.value })}
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddBranch(false)}
                className="flex-1 py-4 bg-gray-100 text-[#0a0a0a] font-syne font-bold uppercase text-sm rounded-2xl hover:bg-gray-200 active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-4 bg-[#FFD600] text-[#0a0a0a] font-syne font-extrabold uppercase text-sm rounded-2xl shadow-[0_4px_16px_rgba(255,214,0,.3)] hover:-translate-y-0.5 active:scale-95 transition-all"
              >
                Confirm Create
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
