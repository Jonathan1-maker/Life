import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { Send, Search, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SuperMessages() {
  const qc = useQueryClient()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.get('/messages/conversations').then(r => r.data.data || []),
    refetchInterval: 5000,
  })

  const active = conversations.find((c: any) => c.partner_id === activeId)

  const { data: messages = [] } = useQuery({
    queryKey: ['conversation', activeId],
    queryFn: () => api.get(`/messages/conversation?with=${activeId}`).then(r => r.data.data || []),
    enabled: !!activeId,
    refetchInterval: 5000,
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMutation = useMutation({
    mutationFn: (body: string) => api.post('/messages', { receiver_id: activeId, subject: 'DM', body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversation', activeId] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
      setInput('')
    },
    onError: () => toast.error('Failed to send'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/messages/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversation', activeId] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
    onError: () => toast.error('Failed to delete'),
  })

  const handleSend = () => {
    if (!input.trim() || !activeId) return
    sendMutation.mutate(input.trim())
  }

  const filtered = conversations.filter((c: any) =>
    c.partner_name?.toLowerCase().includes(search.toLowerCase())
  )

  const totalUnread = conversations.reduce((s: number, c: any) => s + parseInt(c.unread_count || 0), 0)

  return (
    <div className="fade-in h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-5">
        <h1 className="page-title">Messages</h1>
        {totalUnread > 0 && (
          <span className="badge bg-red-100 text-red-600 text-sm">{totalUnread} unread</span>
        )}
      </div>

      <div className="card flex h-[calc(100%-4rem)] overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 border-r border-gray-100 flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-gray-50">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input placeholder="Search..." className="input pl-8 py-2 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-gray-400">No conversations yet</p>
              </div>
            ) : (
              filtered.map((c: any) => (
                <div
                  key={c.partner_id}
                  onClick={() => setActiveId(c.partner_id)}
                  className={`flex items-start gap-3 p-3.5 cursor-pointer hover:bg-gray-50 border-b border-gray-50 ${activeId === c.partner_id ? 'bg-primary-50' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold flex-shrink-0">
                    {c.partner_name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-800 truncate">{c.partner_name}</p>
                      <span className="text-xs text-gray-400 whitespace-nowrap ml-1">
                        {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate capitalize">{c.partner_role?.replace('_', ' ')}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{c.last_message}</p>
                  </div>
                  {parseInt(c.unread_count) > 0 && (
                    <span className="w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">
                      {c.unread_count}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        {!activeId ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-gray-400">Select a conversation</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                {active?.partner_name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{active?.partner_name}</p>
                <p className="text-xs text-gray-400 capitalize">{active?.partner_role?.replace('_', ' ')}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {messages.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No messages yet</p>
              ) : (
                messages.map((m: any) => {
                  const isMe = m.sender_id !== activeId
                  return (
                    <div key={m.id} className={`flex items-end gap-1 group ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-sm px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                        <p>{m.body}</p>
                        <p className={`text-xs mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteMutation.mutate(m.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-100 text-gray-300 hover:text-red-400 transition-opacity flex-shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )
                })
              )}
              <div ref={bottomRef} />
            </div>

            <div className="p-4 border-t border-gray-100 flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Type a message..."
                className="input flex-1"
              />
              <button onClick={handleSend} disabled={!input.trim() || sendMutation.isPending} className="btn-primary px-4">
                <Send size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
