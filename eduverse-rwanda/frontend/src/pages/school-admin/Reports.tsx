import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../../lib/api'
import { FileText, Printer } from 'lucide-react'
import toast from 'react-hot-toast'
import ReportCardPrint from './ReportCardPrint'

export default function SchoolReports() {
  const [classId, setClassId]     = useState('')
  const [studentId, setStudentId] = useState('')
  const [yearId, setYearId]       = useState('')
  const [reportData, setReportData] = useState<any>(null)

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get('/classes').then(r => r.data.data || []),
  })

  const { data: students } = useQuery({
    queryKey: ['report-students', classId],
    queryFn: () => api.get(`/report-cards/students?class_id=${classId}`).then(r => r.data.data || []),
    enabled: !!classId,
  })

  const { data: terms } = useQuery({
    queryKey: ['terms'],
    queryFn: () => api.get('/terms').then(r => r.data.data || []),
    retry: false,
  })

  const academicYears = [
    ...new Map(
      (terms || []).filter((t: any) => t.academic_year_id)
        .map((t: any) => [t.academic_year_id, { id: t.academic_year_id, name: t.year_name }])
    ).values(),
  ] as { id: string; name: string }[]

  const fetchReport = async () => {
    try {
      const params = new URLSearchParams({ student_id: studentId, year_id: yearId })
      const { data } = await api.get(`/report-cards?${params}`)
      setReportData(data.data)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to load report card')
    }
  }

  const generateMutation = useMutation({
    mutationFn: () => api.post('/report-cards/generate', { student_id: studentId, year_id: yearId }),
    onSuccess: () => fetchReport(),
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to generate'),
  })

  const handleGenerate = () => {
    if (!classId)   return toast.error('Select a class')
    if (!studentId) return toast.error('Select a student')
    if (!yearId)    return toast.error('Select an academic year')
    generateMutation.mutate()
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="page-title">Report Cards</h1>
          <p className="text-sm text-gray-500">Generate and print student report cards (all terms)</p>
        </div>
        {reportData && (
          <button onClick={() => window.print()} className="btn-primary no-print">
            <Printer size={15} /> Print Report Card
          </button>
        )}
      </div>

      <div className="card p-5 no-print">
        <h3 className="section-title mb-4">Generate Report Card</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="label">Class</label>
            <select className="input" value={classId}
              onChange={e => { setClassId(e.target.value); setStudentId(''); setReportData(null) }}>
              <option value="">Select class</option>
              {(classes || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Student</label>
            <select className="input" value={studentId} disabled={!classId}
              onChange={e => { setStudentId(e.target.value); setReportData(null) }}>
              <option value="">Select student</option>
              {(students || []).map((s: any) => (
                <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Academic Year</label>
            <select className="input" value={yearId}
              onChange={e => { setYearId(e.target.value); setReportData(null) }}>
              <option value="">Select year</option>
              {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-400">Generates report for all terms in the selected year</p>
          <button onClick={handleGenerate} disabled={generateMutation.isPending || !studentId || !yearId} className="btn-primary px-6">
            <FileText size={15} />
            {generateMutation.isPending ? 'Generating…' : 'Generate Report Card'}
          </button>
        </div>
      </div>

      {reportData && <ReportCardPrint data={reportData} />}
    </div>
  )
}
