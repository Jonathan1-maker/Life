import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../store/auth'
import api from '../../lib/api'
import { Send, Trash2, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ParentMessages() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // Get school admin to message
  const { data: schoolAdmin } = useQuery({
    queryKey: ['school-admin-contact'],
    queryFn: () => api.get('/messages/school-admin-contact').then(r => r.data.data),
    retry: false,
  })

  const { data: thread = [], refetch } = useQuery({
    queryKey: ['conversation', schoolAdmin?.id],
    queryFn: () => api.get(`/messages/conversation?with=${schoolAdmin.id}`).then(r => r.data.data || []),
    enabled: !!schoolAdmin?.id,
    refetchInterval: 5000,
    retry: false,
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread])

  const sendMutation = useMutation({
    mutationFn: (body: string) => api.post('/messages', {
      receiver_id: schoolAdmin.id,
      subject: 'Message',
      body,
    }),
    onSuccess: () => { setInput(''); refetch() },
    onError: () => toast.error('Failed to send message'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/messages/${id}`),
    onSuccess: () => refetch(),
    onError: () => toast.error('Failed to delete'),
  })

  const handleSend = () => {
    if (!input.trim() || !schoolAdmin?.id) return
    sendMutation.mutate(input.trim())
  }

  return (
    <div className="fade-in h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-5">
        <h1 className="page-title">Messages</h1>
        <p className="text-sm text-gray-500">Communicate with your school administration</p>
      </div>

      <div className="card flex flex-col flex-1 overflow-hidden min-h-0">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
            {schoolAdmin ? schoolAdmin.name?.[0]?.toUpperCase() : 'S'}
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">{schoolAdmin?.name || 'School Administration'}</p>
            <p className="text-xs text-gray-400">School Admin</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {!schoolAdmin ? (
            <p className="text-center text-sm text-gray-400 py-10">Loading...</p>
          ) : thread.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
              <MessageSquare size={36} className="opacity-30" />
              <p className="text-sm">No messages yet. Send a message to your school admin!</p>
            </div>
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
                    onClick={() => deleteMutation.mutate(m.id)}
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

        {/* Input */}
        <div className="p-4 border-t border-gray-100 flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Type a message..."
            className="input flex-1"
            disabled={!schoolAdmin}
          />
          <button onClick={handleSend} disabled={!input.trim() || sendMutation.isPending || !schoolAdmin} className="btn-primary px-4">
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
