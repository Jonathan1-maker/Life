import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

interface SubjectRow {
  subject_name: string
  eu: number; eu_max: number
  et: number; et_max: number
  tot: number; tot_max: number
  percent: string; grade: string
}

interface TermReport {
  term: any
  subjects: SubjectRow[]
  has_marks: boolean
  grand_percent: string | null
  final_grade: string | null
  rank: number | null
  class_size: number
  conduct: { marks: number; max_marks: number; comment?: string } | null
}

interface Props { data: any }

const gradeScale = [
  { range: '100-70', letter: 'A', points: 6 },
  { range: '69-65',  letter: 'B', points: 5 },
  { range: '64-60',  letter: 'C', points: 4 },
  { range: '59-50',  letter: 'D', points: 3 },
  { range: '49-40',  letter: 'E', points: 2 },
  { range: '39-20',  letter: 'S', points: 1 },
  { range: '19-0',   letter: 'F', points: 0 },
]

const sc = (obtained: number, max: number, target: number) =>
  max ? (obtained / max) * target : 0

const gr = (pct: number) => {
  if (pct >= 70) return 'A'
  if (pct >= 65) return 'B'
  if (pct >= 60) return 'C'
  if (pct >= 50) return 'D'
  if (pct >= 40) return 'E'
  if (pct >= 20) return 'S'
  return 'F'
}

const red = (pct: number) => (pct < 50 ? '#dc2626' : 'inherit')

function QRCodeCanvas({ value }: { value: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (ref.current && value)
      QRCode.toCanvas(ref.current, value, { width: 80, margin: 1 }).catch(() => {})
  }, [value])
  return <canvas ref={ref} style={{ width: 80, height: 80 }} />
}

export default function ReportCardPrint({ data }: Props) {
  const { student, headmaster, academic_year } = data
  const rawReports: TermReport[] = data.term_reports || []
  const schoolLevel = (student?.school_level || 'ordinary').toLowerCase() === 'advanced'
    ? 'ADVANCED LEVEL'
    : 'ORDINARY LEVEL'

  // ── ALWAYS show exactly 3 term slots (Term 1, Term 2, Term 3)
  // Map by term name so we can place correctly
  const termByName: Record<string, TermReport> = {}
  for (const tr of rawReports) {
    const key = String(tr.term?.name || '')
    termByName[key] = tr
  }

  // Build a 3-slot array — slot i = term (i+1), empty if not in data
  const TERM_SLOTS = ['1', '2', '3']
  const slots: (TermReport | null)[] = TERM_SLOTS.map(n => termByName[n] || null)

  // ── Union of all subject names across all real terms
  const allSubjects: string[] = []
  for (const tr of rawReports)
    for (const s of tr.subjects || [])
      if (!allSubjects.includes(s.subject_name)) allSubjects.push(s.subject_name)
  allSubjects.sort()

  // per-slot subject lookup
  const slotMaps = slots.map(tr => {
    const m: Record<string, SubjectRow> = {}
    if (tr) for (const s of tr.subjects || []) m[s.subject_name] = s
    return m
  })

  // Annual totals per subject (sum across terms that have marks)
  const annMap: Record<string, { eu: number; eu_max: number; et: number; et_max: number }> = {}
  for (const name of allSubjects) {
    annMap[name] = { eu: 0, eu_max: 0, et: 0, et_max: 0 }
    for (const m of slotMaps) {
      const s = m[name]; if (!s) continue
      annMap[name].eu += s.eu; annMap[name].eu_max += s.eu_max
      annMap[name].et += s.et; annMap[name].et_max += s.et_max
    }
  }

  // Inline styles
  const C: React.CSSProperties  = { border: '1px solid #000', padding: '3px 4px', textAlign: 'center', fontSize: 10 }
  const CL: React.CSSProperties = { ...C, textAlign: 'left' }
  const H: React.CSSProperties  = { ...C, fontWeight: 700, background: '#e5e7eb' }
  const HL: React.CSSProperties = { ...H, textAlign: 'left' }

  const yearShort = academic_year?.replace('20', '') ?? ''   // e.g. "24/25"

  const qrValue = [
    `Student: ${student?.last_name} ${student?.first_name}`,
    `ID: ${student?.admission_number || 'N/A'}`,
    `Class: ${student?.class_name || 'N/A'}`,
    `Year: ${academic_year || 'N/A'}`,
    `Result: ${data.combined_percent || '0'}%`,
    `Grade: ${data.combined_grade || 'N/A'}`,
  ].join('\n')

  // Helper: empty 5-cell block for a term slot with no marks
  const EmptyCells = ({ k }: { k: string }) => (
    <>
      <td key={`${k}a`} style={C} />
      <td key={`${k}b`} style={C} />
      <td key={`${k}c`} style={C} />
      <td key={`${k}d`} style={C} />
      <td key={`${k}e`} style={C} />
    </>
  )

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          .rc { box-shadow: none !important; border: 2px solid #000 !important; }
          .rc-wrap {
            position: fixed;
            top: 3mm; left: 3mm;
            width: 291mm;
            transform: scale(1.0);
            transform-origin: top left;
          }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          td, th { border-color: #000 !important; }
        }
        @page { size: A4 landscape; margin: 0; }
      `}</style>

      <div className="rc-wrap">
      <div className="rc bg-white border border-gray-400 p-3 mx-auto"
        style={{ fontFamily: 'Arial, sans-serif', width: '291mm', fontSize: 10 }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <div style={{ lineHeight: 1.6 }}>
            <div style={{ fontWeight: 700 }}>REPUBLIC OF RWANDA</div>
            <div style={{ fontWeight: 700 }}>MINISTRY OF EDUCATION</div>
            <div>DISTRICT: {student?.school_province || '—'}</div>
            <div>School: {student?.school_name || '—'}</div>
            <div>Email: {student?.school_email || '—'}</div>
            <div>Phone: {student?.school_phone || '—'}</div>
          </div>
          <div style={{ textAlign: 'center', border: '2px solid #374151', padding: '4px 24px', alignSelf: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 11 }}>STUDENT REPORT CARD</div>
            <div style={{ fontWeight: 700, fontSize: 11 }}>{schoolLevel}</div>
          </div>
          <div style={{ textAlign: 'right', lineHeight: 1.6 }}>
            <div><b>Academic Year:</b> {academic_year || '—'}</div>
            <div><b>Level:</b> {schoolLevel}</div>
            <div><b>Class:</b> {student?.class_name || '—'}</div>
          </div>
        </div>

        {/* ── Student info ── */}
        <div style={{ border: '1px solid #000', padding: '3px 6px', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <b>Names:</b> <span style={{ textTransform: 'uppercase' }}>{student?.last_name} {student?.first_name}</span>
          </div>
          <div>
            <b>Registration ID:</b> {student?.admission_number || '—'}
          </div>
        </div>

        {/* ── Main table ── */}
        <div style={{ overflowX: 'auto', marginBottom: 4 }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '18%' }} />
              {/* MAXIMUM: 3 cols */}
              <col /><col /><col />
              {/* 3 terms × 5 cols each = 15 cols */}
              {TERM_SLOTS.flatMap((_, i) => Array(5).fill(null).map((__, j) => <col key={`t${i}c${j}`} />))}
              {/* Annual: 5 cols */}
              <col /><col /><col /><col /><col />
            </colgroup>

            <thead>
              {/* Row 1 — group headers */}
              <tr>
                <th style={HL} rowSpan={3}>SUBJECT</th>
                <th style={H} colSpan={3}>MAXIMUM</th>
                {TERM_SLOTS.map((n, i) => (
                  <th key={i} style={H} colSpan={5}>
                    Term {n}/{academic_year}
                  </th>
                ))}
                <th style={H} colSpan={5}>Annual Total</th>
              </tr>

              {/* Row 2 — EU ET TOT % GR per group */}
              <tr>
                <th style={H}>EU</th><th style={H}>ET</th><th style={H}>TOT</th>
                {TERM_SLOTS.map((_, i) => (
                  <>
                    <th key={`${i}eu`} style={H}>EU</th>
                    <th key={`${i}et`} style={H}>ET</th>
                    <th key={`${i}tot`} style={H}>TOT</th>
                    <th key={`${i}pct`} style={H}>%</th>
                    <th key={`${i}gr`} style={H}>GR</th>
                  </>
                ))}
                <th style={H}>EU</th><th style={H}>ET</th>
                <th style={H}>TOT</th><th style={H}>MAX</th><th style={H}>%</th>
              </tr>

              {/* Row 3 — weights */}
              <tr>
                <th style={H}>50%</th><th style={H}>50%</th><th style={H}>100%</th>
                {TERM_SLOTS.map((_, i) => (
                  <>
                    <th key={`${i}a`} style={H}>50%</th>
                    <th key={`${i}b`} style={H}>50%</th>
                    <th key={`${i}c`} style={H}>100%</th>
                    <th key={`${i}d`} style={H}></th>
                    <th key={`${i}e`} style={H}></th>
                  </>
                ))}
                <th style={H}></th><th style={H}></th>
                <th style={H}></th><th style={H}></th><th style={H}>GR</th>
              </tr>

              {/* Conduct row */}
              <tr>
                <td style={{ ...CL, fontWeight: 700 }}>Conduct</td>
                <td style={C} /><td style={C} /><td style={{ ...C }}>40</td>
                {slots.map((tr, i) => (
                  <>
                    <td key={`${i}a`} style={C} />
                    <td key={`${i}b`} style={C} />
                    <td key={`${i}c`} style={C}>{tr?.conduct ? tr.conduct.marks : '……'}</td>
                    <td key={`${i}d`} style={C} />
                    <td key={`${i}e`} style={C}>/40</td>
                  </>
                ))}
                <td style={C} /><td style={C} />
                <td style={C}>……</td><td style={C} /><td style={C}>/40</td>
              </tr>

              {/* Section label */}
              <tr>
                <td colSpan={1 + 3 + TERM_SLOTS.length * 5 + 5}
                  style={{ ...CL, fontWeight: 700, color: '#1d4ed8', background: '#eff6ff' }}>
                  All Subjects
                </td>
              </tr>
            </thead>

            <tbody>
              {allSubjects.map((name, ri) => {
                const ann  = annMap[name]
                const aEU  = sc(ann.eu, ann.eu_max, 50)
                const aET  = sc(ann.et, ann.et_max, 50)
                const aTot = aEU + aET
                const aPct = aTot
                const aGr  = gr(aPct)

                return (
                  <tr key={ri} style={{ background: ri % 2 ? '#f9fafb' : '#fff' }}>
                    <td style={CL}>{name}</td>
                    {/* Maximum */}
                    <td style={C}>50</td><td style={C}>50</td><td style={C}>100</td>
                    {/* Per-term (3 slots) */}
                    {slots.map((tr, ti) => {
                      const s = slotMaps[ti][name]
                      if (!s) return <EmptyCells key={ti} k={`${ti}${name}`} />
                      const eu50 = sc(s.eu, s.eu_max, 50)
                      const et50 = sc(s.et, s.et_max, 50)
                      const tot  = eu50 + et50
                      const pct  = tot
                      const g    = gr(pct)
                      return (
                        <>
                          <td key={`${ti}a`} style={{ ...C, color: red(eu50 * 2) }}>{eu50.toFixed(1)}</td>
                          <td key={`${ti}b`} style={{ ...C, color: red(et50 * 2) }}>{et50.toFixed(1)}</td>
                          <td key={`${ti}c`} style={{ ...C, color: red(pct) }}>{tot.toFixed(1)}</td>
                          <td key={`${ti}d`} style={{ ...C, color: red(pct) }}>{pct.toFixed(1)}</td>
                          <td key={`${ti}e`} style={{ ...C, fontWeight: 700, color: g === 'F' ? '#dc2626' : 'inherit' }}>{g}</td>
                        </>
                      )
                    })}
                    {/* Annual */}
                    <td style={{ ...C, color: red(aPct) }}>{aEU.toFixed(1)}</td>
                    <td style={{ ...C, color: red(aPct) }}>{aET.toFixed(1)}</td>
                    <td style={{ ...C, color: red(aPct) }}>{aTot.toFixed(1)}</td>
                    <td style={C}>100</td>
                    <td style={{ ...C, fontWeight: 700, color: aGr === 'F' ? '#dc2626' : 'inherit' }}>{aGr}</td>
                  </tr>
                )
              })}

              {/* ── Total ── */}
              <tr style={{ fontWeight: 700, background: '#f3f4f6' }}>
                <td style={CL}>Total</td>
                <td style={C}>480</td><td style={C}>480</td><td style={C}>960</td>
                {slots.map((tr, ti) => {
                  if (!tr?.has_marks) return <EmptyCells key={ti} k={`tot${ti}`} />
                  let sumEU = 0, sumET = 0, sumTot = 0
                  for (const name of allSubjects) {
                    const s = slotMaps[ti][name]; if (!s) continue
                    const eu50 = sc(s.eu, s.eu_max, 50)
                    const et50 = sc(s.et, s.et_max, 50)
                    sumEU += eu50; sumET += et50; sumTot += eu50 + et50
                  }
                  const cnt = allSubjects.length || 1
                  return (
                    <>
                      <td key={`${ti}a`} style={{ ...C, color: '#1d4ed8' }}>{sumEU.toFixed(1)}</td>
                      <td key={`${ti}b`} style={{ ...C, color: '#7c3aed' }}>{sumET.toFixed(1)}</td>
                      <td key={`${ti}c`} style={C}>{sumTot.toFixed(1)}</td>
                      <td key={`${ti}d`} style={C}>{(sumTot / cnt).toFixed(1)}</td>
                      <td key={`${ti}e`} style={C}>{tr.final_grade || ''}</td>
                    </>
                  )
                })}
                {/* Annual grand total */}
                {(() => {
                  let sumEU = 0, sumET = 0, sumTot = 0
                  for (const name of allSubjects) {
                    const a = annMap[name]
                    sumEU  += sc(a.eu, a.eu_max, 50)
                    sumET  += sc(a.et, a.et_max, 50)
                    sumTot += sc(a.eu, a.eu_max, 50) + sc(a.et, a.et_max, 50)
                  }
                  return (
                    <>
                      <td style={{ ...C, color: '#1d4ed8' }}>{sumEU.toFixed(1)}</td>
                      <td style={{ ...C, color: '#7c3aed' }}>{sumET.toFixed(1)}</td>
                      <td style={C}>{sumTot.toFixed(1)}</td>
                      <td style={C}>{allSubjects.length * 100}</td>
                      <td style={C}>{data.combined_grade || ''}</td>
                    </>
                  )
                })()}
              </tr>

              {/* ── Percentage ── */}
              <tr>
                <td style={{ ...CL, fontWeight: 700 }}>Percentage</td>
                <td style={C} colSpan={3} />
                {slots.map((tr, ti) => (
                  <>
                    <td key={`${ti}a`} style={{ ...C, fontWeight: 700 }} colSpan={4}>
                      {tr?.has_marks ? `${tr.grand_percent}%` : ''}
                    </td>
                    <td key={`${ti}b`} style={C} />
                  </>
                ))}
                <td style={{ ...C, fontWeight: 700 }} colSpan={4}>{data.combined_percent}%</td>
                <td style={C} />
              </tr>

              {/* ── Final Grade ── */}
              <tr>
                <td style={{ ...CL, fontWeight: 700 }}>Final Grade</td>
                <td style={C} colSpan={3} />
                {slots.map((tr, ti) => (
                  <>
                    <td key={`${ti}a`} style={{ ...C, fontWeight: 700 }} colSpan={4}>
                      {tr?.has_marks ? tr.final_grade : ''}
                    </td>
                    <td key={`${ti}b`} style={C} />
                  </>
                ))}
                <td style={{ ...C, fontWeight: 700 }} colSpan={4}>{data.combined_grade || ''}</td>
                <td style={C} />
              </tr>

              {/* ── Position ── */}
              <tr>
                <td style={{ ...CL, fontWeight: 700 }}>Position</td>
                <td style={C} colSpan={3} />
                {slots.map((tr, ti) => (
                  <>
                    <td key={`${ti}a`} style={C} colSpan={4}>
                      {tr?.has_marks && tr.rank ? `${tr.rank} out of ${tr.class_size}` : ''}
                    </td>
                    <td key={`${ti}b`} style={C} />
                  </>
                ))}
                <td style={C} colSpan={4}>
                  {data.combined_rank ? `${data.combined_rank} out of ${data.class_size}` : '—'}
                </td>
                <td style={C} />
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Comment + Signatures ── */}
        <div style={{ border: '1px solid #000', marginBottom: 4 }}>
          <div style={{ borderBottom: '1px solid #000', padding: '4px 6px', minHeight: 36 }}>
            <b>Comment:</b>&nbsp;
            {rawReports.map(tr => tr.conduct?.comment).filter(Boolean).join(' | ') || ''}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            <div style={{ borderRight: '1px solid #000', padding: '4px 6px' }}>
              <b>Class teacher's Signature:</b>
            </div>
            <div style={{ padding: '4px 6px' }}>
              <b>Parent's Signature:</b>
            </div>
          </div>
        </div>

        {/* ── Grading scale ── */}
        <div style={{ border: '1px solid #000', marginBottom: 4 }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <tbody>
              <tr>
                <td style={{ ...CL, fontWeight: 700, width: '10%' }} rowSpan={3}>Grading scale</td>
                <td style={H}>Percentage</td>
                {gradeScale.map(g => <td key={g.letter} style={C}>{g.range}</td>)}
              </tr>
              <tr>
                <td style={H}>Letter Grade</td>
                {gradeScale.map(g => <td key={g.letter} style={{ ...C, fontWeight: 700 }}>{g.letter}</td>)}
              </tr>
              <tr>
                <td style={H}>Grade Value</td>
                {gradeScale.map(g => <td key={g.letter} style={C}>{g.points}</td>)}
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Footer ── */}
        <div style={{ border: '1px solid #000', display: 'flex', justifyContent: 'space-between', padding: 8, gap: 12 }}>
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 6 }}>
              <div>
                <div style={{ fontWeight: 700 }}>First Decision</div>
                <div>Promoted</div><div>2<sup>nd</sup> Sitting</div><div>Discontinued</div>
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>Final Decision</div>
                <div>Promoted</div><div>2<sup>nd</sup> Sitting</div><div>Discontinued</div>
              </div>
            </div>
            <div style={{ fontWeight: 700 }}>Abbreviations</div>
            <div><b>EU</b>: CATs /50 &nbsp; <b>ET</b>: Exam /50 &nbsp; <b>TOT</b>: EU+ET /100 &nbsp; <b>GR</b>: Grade &nbsp; <b>%</b>: Percentage</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 8 }}>HEADTEACHER</div>
            <div>Signature</div>
            <div style={{ borderBottom: '1px solid #000', width: 100, margin: '4px auto' }} />
            <div style={{ fontWeight: 700, textTransform: 'uppercase' }}>
              {headmaster ? `${headmaster.first_name} ${headmaster.last_name}` : '—'}
            </div>
            <div style={{ fontSize: 8, color: '#6b7280', marginTop: 4 }}>Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <QRCodeCanvas value={qrValue} />
          </div>
        </div>

      </div>
      </div>
    </>
  )
}
