import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../store/auth'
import api from '../../lib/api'
import { Send, Search } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ParentMessages() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [active, setActive] = useState<any>(null)
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: inbox } = useQuery({
    queryKey: ['inbox'],
    queryFn: () => api.get('/messages/inbox').then(r => r.data.data || []),
    refetchInterval: 10000,
    retry: false,
  })

  const { data: thread } = useQuery({
    queryKey: ['thread', active?.sender_id],
    queryFn: () => api.get('/messages/inbox').then(r =>
      (r.data.data || []).filter((m: any) => m.sender_id === active.sender_id || m.receiver_id === active.sender_id)
    ),
    enabled: !!active,
    refetchInterval: 5000,
    retry: false,
  })

  const sendMutation = useMutation({
    mutationFn: (body: string) => api.post('/messages', {
      receiver_id: active?.sender_id,
      subject: active?.subject || 'Reply',
      body,
    }),
    onSuccess: () => {
      setInput('')
      qc.invalidateQueries({ queryKey: ['inbox'] })
      qc.invalidateQueries({ queryKey: ['thread', active?.sender_id] })
    },
    onError: () => toast.error('Failed to send message'),
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/messages/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inbox'] }),
  })

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [thread])

  const conversations = [...new Map((inbox || []).map((m: any) => [m.sender_id, m])).values()]
    .filter((m: any) => `${m.sender_name}`.toLowerCase().includes(search.toLowerCase()))

  const handleSelect = (c: any) => {
    setActive(c)
    if (!c.is_read) markReadMutation.mutate(c.id)
  }

  const send = () => {
    if (!input.trim() || !active) return
    sendMutation.mutate(input.trim())
  }

  return (
    <div className="fade-in h-[calc(100vh-8rem)]">
      <div className="mb-5">
        <h1 className="page-title">Messages</h1>
        <p className="text-sm text-gray-500">Communicate with teachers and school administration</p>
      </div>

      <div className="card flex h-[calc(100%-5rem)] overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 border-r border-gray-100 flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-gray-50">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="input pl-8 py-2 text-sm" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-8">No messages yet</p>
            ) : conversations.map((c: any) => (
              <div
                key={c.id}
                onClick={() => handleSelect(c)}
                className={`flex items-start gap-3 p-3.5 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50 ${active?.sender_id === c.sender_id ? 'bg-primary-50' : ''}`}
              >
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold flex-shrink-0">
                  {c.sender_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800 truncate">{c.sender_name}</p>
                    <span className="text-xs text-gray-400 ml-1 flex-shrink-0">{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{c.body}</p>
                </div>
                {!c.is_read && <div className="w-2 h-2 bg-primary-500 rounded-full mt-1.5 flex-shrink-0" />}
              </div>
            ))}
          </div>
        </div>

        {/* Chat area */}
        {!active ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Select a conversation to view messages
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-w-0">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                {active.sender_name?.[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{active.sender_name}</p>
                <p className="text-xs text-gray-400">{active.subject}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {(thread || []).map((m: any) => {
                const isMe = m.sender_id === user?.id
                return (
                  <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                      <p>{m.body}</p>
                      <p className={`text-xs mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            <div className="p-4 border-t border-gray-100 flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Type a message..."
                className="input flex-1"
              />
              <button onClick={send} disabled={sendMutation.isPending || !input.trim()} className="btn-primary px-4">
                <Send size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
