import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../store/auth'
import api from '../../lib/api'
import { Send, Search, Plus, Trash2, X, Loader2, MessageSquare, Bell, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'border-l-red-500 bg-red-50',
  high:   'border-l-orange-500 bg-orange-50',
  normal: 'border-l-blue-500 bg-blue-50',
  low:    'border-l-gray-300 bg-gray-50',
}
const PRIORITY_BADGE: Record<string, string> = {
  urgent: 'bg-red-100 text-red-600',
  high:   'bg-orange-100 text-orange-600',
  normal: 'bg-blue-100 text-blue-600',
  low:    'bg-gray-100 text-gray-500',
}

export default function SchoolMessages() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [tab, setTab] = useState<'messages' | 'announcements'>('messages')
  const [activeContact, setActiveContact] = useState<any>(null)
  const [contactSearch, setContactSearch] = useState('')
  const [msgInput, setMsgInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const [showAnnModal, setShowAnnModal] = useState(false)
  const [annForm, setAnnForm] = useState({ title: '', content: '', priority: 'normal', target_roles: [] as string[] })

  // ── Data ──
  const { data: superAdmin } = useQuery({
    queryKey: ['super-admin-user'],
    queryFn: () => api.get('/messages/super-admin').then(r => r.data.data),
    retry: false,
  })

  const { data: parents = [] } = useQuery({
    queryKey: ['school-parents-msg'],
    queryFn: () => api.get('/messages/school-parents').then(r => r.data.data || []),
    retry: false,
  })

  const { data: thread = [], refetch: refetchThread } = useQuery({
    queryKey: ['conversation', activeContact?.id],
    queryFn: () => api.get(`/messages/conversation?with=${activeContact.id}`).then(r => r.data.data || []),
    enabled: !!activeContact?.id,
    refetchInterval: 5000,
    retry: false,
  })

  const { data: announcements = [], refetch: refetchAnn } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => api.get('/announcements').then(r => r.data.data || []),
    retry: false,
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread])

  // ── Mutations ──
  const sendMutation = useMutation({
    mutationFn: (body: string) => api.post('/messages', { receiver_id: activeContact.id, subject: 'Message', body }),
    onSuccess: () => { setMsgInput(''); refetchThread(); qc.invalidateQueries({ queryKey: ['school-parents-msg'] }) },
    onError: () => toast.error('Failed to send message'),
  })

  const deleteMsgMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/messages/${id}`),
    onSuccess: () => refetchThread(),
    onError: () => toast.error('Failed to delete'),
  })

  const createAnnMutation = useMutation({
    mutationFn: (payload: any) => api.post('/announcements', payload),
    onSuccess: () => {
      toast.success('Announcement posted!')
      refetchAnn()
      qc.invalidateQueries({ queryKey: ['announcements'] })
      setShowAnnModal(false)
      setAnnForm({ title: '', content: '', priority: 'normal', target_roles: [] })
    },
    onError: () => toast.error('Failed to post announcement'),
  })

  const deleteAnnMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/announcements/${id}`),
    onSuccess: () => { refetchAnn(); qc.invalidateQueries({ queryKey: ['announcements'] }) },
    onError: () => toast.error('Failed to delete'),
  })

  // Build contact list: site admin first, then parents
  const siteAdminContact = superAdmin ? { ...superAdmin, _type: 'admin' } : null
  const allContacts = [
    ...(siteAdminContact ? [siteAdminContact] : []),
    ...parents.map((p: any) => ({ ...p, _type: 'parent' })),
  ].filter((c: any) => c.name?.toLowerCase().includes(contactSearch.toLowerCase()))

  const handleSend = () => {
    if (!msgInput.trim() || !activeContact) return
    sendMutation.mutate(msgInput.trim())
  }

  const toggleRole = (role: string) =>
    setAnnForm(f => ({
      ...f,
      target_roles: f.target_roles.includes(role)
        ? f.target_roles.filter(r => r !== role)
        : [...f.target_roles, role],
    }))

  return (
    <div className="fade-in h-[calc(100vh-6rem)] flex flex-col gap-4">
      <div>
        <h1 className="page-title">Communication</h1>
        <p className="text-sm text-gray-500">Message site admin, parents and post announcements</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit flex-shrink-0">
        {[
          { key: 'messages', label: 'Messages', icon: MessageSquare },
          { key: 'announcements', label: 'Announcements', icon: Bell },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === key ? 'bg-white shadow text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* ── MESSAGES TAB ── */}
      {tab === 'messages' && (
        <div className="card flex flex-1 overflow-hidden min-h-0">
          {/* Contacts sidebar */}
          <div className="w-64 border-r border-gray-100 flex flex-col flex-shrink-0">
            <div className="p-3 border-b border-gray-50 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contacts</p>
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={contactSearch}
                  onChange={e => setContactSearch(e.target.value)}
                  placeholder="Search..."
                  className="input pl-8 py-1.5 text-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {allContacts.length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-8">No contacts found</p>
              ) : allContacts.map((c: any) => {
                const isAdmin = c._type === 'admin'
                const unread = parseInt(c.unread_count || 0)
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveContact(c)}
                    className={`w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 text-left ${activeContact?.id === c.id ? 'bg-primary-50' : ''}`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${isAdmin ? 'bg-primary-100 text-primary-700' : 'bg-orange-100 text-orange-700'}`}>
                      {isAdmin ? <ShieldCheck size={16} /> : c.name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
                      <p className="text-xs text-gray-400">{isAdmin ? 'Site Admin' : 'Parent'}</p>
                    </div>
                    {unread > 0 && (
                      <span className="w-5 h-5 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                        {unread}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Chat area */}
          {!activeContact ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
              <MessageSquare size={36} className="opacity-30" />
              <p className="text-sm">Select a contact to start messaging</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-w-0">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${activeContact._type === 'admin' ? 'bg-primary-100 text-primary-700' : 'bg-orange-100 text-orange-700'}`}>
                  {activeContact._type === 'admin' ? <ShieldCheck size={16} /> : activeContact.name?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{activeContact.name}</p>
                  <p className="text-xs text-gray-400">{activeContact._type === 'admin' ? 'Site Admin' : activeContact.email}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {thread.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-10">No messages yet. Send the first message!</p>
                ) : thread.map((m: any) => {
                  const isMe = m.sender_id === user?.id
                  return (
                    <div key={m.id} className={`flex items-end gap-1 group ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-sm px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                        <p>{m.body}</p>
                        <p className={`text-xs mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {isMe && (
                        <button
                          onClick={() => deleteMsgMutation.mutate(m.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-100 text-gray-300 hover:text-red-400 transition-opacity"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              <div className="p-4 border-t border-gray-100 flex gap-2">
                <input
                  value={msgInput}
                  onChange={e => setMsgInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder={`Message ${activeContact.name}...`}
                  className="input flex-1"
                />
                <button onClick={handleSend} disabled={!msgInput.trim() || sendMutation.isPending} className="btn-primary px-4">
                  {sendMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ANNOUNCEMENTS TAB ── */}
      {tab === 'announcements' && (
        <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{announcements.length} announcement{announcements.length !== 1 ? 's' : ''}</p>
            <button onClick={() => setShowAnnModal(true)} className="btn-primary">
              <Plus size={15} /> New Announcement
            </button>
          </div>

          {announcements.length === 0 ? (
            <div className="card p-12 flex flex-col items-center text-gray-400">
              <Bell size={40} className="opacity-30 mb-3" />
              <p className="text-sm">No announcements yet</p>
              <button onClick={() => setShowAnnModal(true)} className="btn-primary mt-4 text-sm"><Plus size={14} /> Post First Announcement</button>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((a: any) => (
                <div key={a.id} className={`card p-4 border-l-4 ${PRIORITY_STYLES[a.priority] || PRIORITY_STYLES.normal}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-gray-900 text-sm">{a.title}</p>
                        <span className={`badge text-xs ${PRIORITY_BADGE[a.priority] || PRIORITY_BADGE.normal}`}>{a.priority}</span>
                        {(a.target_roles?.length ? a.target_roles : ['everyone']).map((r: string) => (
                          <span key={r} className="badge bg-gray-100 text-gray-500 text-xs capitalize">{r.replace('_', ' ')}</span>
                        ))}
                      </div>
                      <p className="text-sm text-gray-700">{a.content}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {a.created_by_name} · {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <button
                      onClick={() => { if (confirm('Delete this announcement?')) deleteAnnMutation.mutate(a.id) }}
                      className="p-1.5 hover:bg-white/60 rounded-lg text-gray-400 hover:text-red-500 flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── New Announcement Modal ── */}
      {showAnnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">New Announcement</h2>
              <button onClick={() => setShowAnnModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="label">Title *</label>
                <input value={annForm.title} onChange={e => setAnnForm(f => ({ ...f, title: e.target.value }))} className="input" placeholder="Announcement title" />
              </div>
              <div>
                <label className="label">Content *</label>
                <textarea value={annForm.content} onChange={e => setAnnForm(f => ({ ...f, content: e.target.value }))} className="input h-28 resize-none" placeholder="Write the announcement..." />
              </div>
              <div>
                <label className="label">Priority</label>
                <select value={annForm.priority} onChange={e => setAnnForm(f => ({ ...f, priority: e.target.value }))} className="input">
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="label">Target Audience</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {['teacher', 'student', 'parent'].map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleRole(role)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all capitalize ${annForm.target_roles.includes(role) ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-400'}`}
                    >
                      {role}s
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAnnForm(f => ({ ...f, target_roles: [] }))}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${annForm.target_roles.length === 0 ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-400'}`}
                  >
                    Everyone
                  </button>
                </div>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100">
                <button onClick={() => setShowAnnModal(false)} className="btn-secondary">Cancel</button>
                <button
                  onClick={() => {
                    if (!annForm.title.trim() || !annForm.content.trim()) return toast.error('Title and content are required')
                    createAnnMutation.mutate(annForm)
                  }}
                  disabled={createAnnMutation.isPending}
                  className="btn-primary px-6"
                >
                  {createAnnMutation.isPending ? <><Loader2 size={15} className="animate-spin" /> Posting...</> : 'Post Announcement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
