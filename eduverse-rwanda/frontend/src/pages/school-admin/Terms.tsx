import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { Plus, Trash2, X, Loader2, CalendarRange, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

const emptyTerm = { name: '', start_date: '', end_date: '', academic_year_id: '', is_current: false }

export default function SchoolTerms() {
  const qc = useQueryClient()

  const [showYearModal, setShowYearModal]   = useState(false)
  const [showTermModal, setShowTermModal]   = useState(false)
  const [yearForm, setYearForm] = useState({ name: '', start_date: '', end_date: '' })
  const [termForm, setTermForm]             = useState({ ...emptyTerm })

  /* ── queries ── */
  const { data: terms, isLoading } = useQuery({
    queryKey: ['terms'],
    queryFn: () => api.get('/terms').then(r => r.data.data || []),
  })

  const { data: academicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => api.get('/academic-years').then(r => r.data.data || []),
    retry: false,
  })

  // Group terms by academic year
  const grouped: Record<string, { year: any; terms: any[] }> = {}
  ;(terms || []).forEach((t: any) => {
    const key = t.academic_year_id || 'none'
    if (!grouped[key]) grouped[key] = { year: { id: t.academic_year_id, name: t.year_name }, terms: [] }
    grouped[key].terms.push(t)
  })

  /* ── mutations ── */
  const createYearMutation = useMutation({
    mutationFn: (payload: any) => api.post('/academic-years', payload),
    onSuccess: () => {
      toast.success('Academic year created!')
      qc.invalidateQueries({ queryKey: ['academic-years'] })
      qc.invalidateQueries({ queryKey: ['terms'] })
      setShowYearModal(false)
      setYearForm({ name: '', start_date: '', end_date: '' })
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create academic year'),
  })

  const createTermMutation = useMutation({
    mutationFn: (payload: any) => api.post('/terms', payload),
    onSuccess: () => {
      toast.success('Term created!')
      qc.invalidateQueries({ queryKey: ['terms'] })
      setShowTermModal(false)
      setTermForm({ ...emptyTerm })
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create term'),
  })

  const deleteTermMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/terms/${id}`),
    onSuccess: () => {
      toast.success('Term deleted')
      qc.invalidateQueries({ queryKey: ['terms'] })
    },
    onError: () => toast.error('Failed to delete term'),
  })

  const handleCreateTerm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!termForm.name)       return toast.error('Enter a term name')
    if (!termForm.start_date) return toast.error('Enter a start date')
    if (!termForm.end_date)   return toast.error('Enter an end date')
    createTermMutation.mutate({
      ...termForm,
      academic_year_id: termForm.academic_year_id || null,
    })
  }

  const handleCreateYear = (e: React.FormEvent) => {
    e.preventDefault()
    if (!yearForm.name) return toast.error('Enter a year name')
    createYearMutation.mutate(yearForm)
  }

  const allYearsForSelect = [
    ...new Map(
      (terms || []).filter((t: any) => t.academic_year_id)
        .map((t: any) => [t.academic_year_id, { id: t.academic_year_id, name: t.year_name }])
    ).values(),
    ...(academicYears || []),
  ].filter((v, i, a) => a.findIndex((x: any) => x.id === (v as any).id) === i) as { id: string; name: string }[]

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Terms & Academic Years</h1>
          <p className="text-sm text-gray-500">Manage academic years and school terms</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowYearModal(true)} className="btn-secondary">
            <Plus size={15} /> New Academic Year
          </button>
          <button onClick={() => setShowTermModal(true)} className="btn-primary">
            <Plus size={15} /> New Term
          </button>
        </div>
      </div>

      {/* Terms grouped by academic year */}
      {isLoading ? (
        <div className="card flex items-center justify-center h-40">
          <Loader2 className="animate-spin text-primary-500" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="card flex flex-col items-center justify-center h-48 gap-4">
          <CalendarRange size={32} className="text-gray-300" />
          <p className="text-gray-400 text-sm">No terms yet — create an academic year and add terms</p>
          <div className="flex gap-2">
            <button onClick={() => setShowYearModal(true)} className="btn-secondary text-xs py-1.5">
              <Plus size={13} /> Academic Year
            </button>
            <button onClick={() => setShowTermModal(true)} className="btn-primary text-xs py-1.5">
              <Plus size={13} /> Term
            </button>
          </div>
        </div>
      ) : (
        Object.values(grouped).map(({ year, terms: groupTerms }) => (
          <div key={year.id || 'none'} className="card overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
              <CalendarRange size={16} className="text-primary-500" />
              <h3 className="font-semibold text-gray-800">{year.name || 'No Academic Year'}</h3>
              <span className="badge bg-gray-100 text-gray-500">{groupTerms.length} term{groupTerms.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="divide-y divide-gray-50">
              {groupTerms.map((t: any) => (
                <div key={t.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary-700 font-bold text-sm">
                      {t.name}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">Term {t.name}</p>
                      <p className="text-xs text-gray-400">
                        {t.start_date ? new Date(t.start_date).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        {' '}&rarr;{' '}
                        {t.end_date ? new Date(t.end_date).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </p>
                    </div>
                    {t.is_current && (
                      <span className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={11} /> Current
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => { if (confirm(`Delete Term ${t.name}? This will remove marks linked to this term.`)) deleteTermMutation.mutate(t.id) }}
                    className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* ── New Academic Year Modal ── */}
      {showYearModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">New Academic Year</h2>
              <button onClick={() => setShowYearModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCreateYear} className="px-6 py-5 space-y-4">
              <div>
                <label className="label">Year Name *</label>
                <input
                  value={yearForm.name}
                  onChange={e => setYearForm(f => ({ ...f, name: e.target.value }))}
                  required
                  className="input"
                  placeholder="e.g. 2024–2025"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Date</label>
                  <input
                    type="date"
                    value={yearForm.start_date}
                    onChange={e => setYearForm(f => ({ ...f, start_date: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">End Date</label>
                  <input
                    type="date"
                    value={yearForm.end_date}
                    onChange={e => setYearForm(f => ({ ...f, end_date: e.target.value }))}
                    className="input"
                  />
                </div>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowYearModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={createYearMutation.isPending} className="btn-primary px-6">
                  {createYearMutation.isPending ? <><Loader2 size={15} className="animate-spin" /> Creating…</> : 'Create Year'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── New Term Modal ── */}
      {showTermModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">New Term</h2>
              <button onClick={() => setShowTermModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCreateTerm} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Term Name *</label>
                  <select
                    value={termForm.name}
                    onChange={e => setTermForm(f => ({ ...f, name: e.target.value }))}
                    required
                    className="input"
                  >
                    <option value="">Select term</option>
                    <option value="1">Term 1</option>
                    <option value="2">Term 2</option>
                    <option value="3">Term 3</option>
                  </select>
                </div>
                <div>
                  <label className="label">Academic Year</label>
                  <select
                    value={termForm.academic_year_id}
                    onChange={e => setTermForm(f => ({ ...f, academic_year_id: e.target.value }))}
                    className="input"
                  >
                    <option value="">None</option>
                    {allYearsForSelect.map((y: any) => (
                      <option key={y.id} value={y.id}>{y.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Start Date *</label>
                  <input
                    type="date"
                    value={termForm.start_date}
                    onChange={e => setTermForm(f => ({ ...f, start_date: e.target.value }))}
                    required
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">End Date *</label>
                  <input
                    type="date"
                    value={termForm.end_date}
                    onChange={e => setTermForm(f => ({ ...f, end_date: e.target.value }))}
                    required
                    className="input"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_current"
                  checked={termForm.is_current}
                  onChange={e => setTermForm(f => ({ ...f, is_current: e.target.checked }))}
                  className="w-4 h-4 accent-primary-600"
                />
                <label htmlFor="is_current" className="text-sm text-gray-700">Mark as current term</label>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowTermModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={createTermMutation.isPending} className="btn-primary px-6">
                  {createTermMutation.isPending ? <><Loader2 size={15} className="animate-spin" /> Creating…</> : 'Create Term'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
