import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { Send, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SchoolMessages() {
  const qc = useQueryClient()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: superAdmin } = useQuery({
    queryKey: ['super-admin-user'],
    queryFn: () => api.get('/messages/super-admin').then(r => r.data.data),
  })

  const { data: messages = [] } = useQuery({
    queryKey: ['conversation', superAdmin?.id],
    queryFn: () => api.get(`/messages/conversation?with=${superAdmin.id}`).then(r => r.data.data || []),
    enabled: !!superAdmin?.id,
    refetchInterval: 5000,
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMutation = useMutation({
    mutationFn: (body: string) => api.post('/messages', { receiver_id: superAdmin.id, subject: 'DM', body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversation', superAdmin?.id] })
      setInput('')
    },
    onError: () => toast.error('Failed to send message'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/messages/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversation', superAdmin?.id] }),
    onError: () => toast.error('Failed to delete'),
  })

  const handleSend = () => {
    if (!input.trim() || !superAdmin?.id) return
    sendMutation.mutate(input.trim())
  }

  return (
    <div className="fade-in h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-5">
        <h1 className="page-title">Messages</h1>
        <p className="text-sm text-gray-500">Direct message to site administrator</p>
      </div>

      <div className="card flex flex-col flex-1 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
            {superAdmin ? superAdmin.name.charAt(0).toUpperCase() : 'S'}
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">{superAdmin?.name || 'Site Administrator'}</p>
            <p className="text-xs text-gray-400">Super Admin</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {!superAdmin ? (
            <p className="text-sm text-gray-400 text-center py-8">Loading...</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No messages yet. Say hello! 👋</p>
          ) : (
            messages.map((m: any) => {
              const isMe = m.sender_id !== superAdmin.id
              return (
                <div key={m.id} className={`flex items-end gap-1 group ${isMe ? 'justify-end' : 'justify-start'}`}>
                  {!isMe && <div className="w-1" />}
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
            disabled={!superAdmin}
          />
          <button onClick={handleSend} disabled={!input.trim() || sendMutation.isPending} className="btn-primary px-4">
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
