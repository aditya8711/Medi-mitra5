import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchDoctorQueue, fetchAttendedPatients } from "../utils/dashboardSlice";
import DashboardLayout from '../components/DashboardLayout';
import { getSocket } from '../utils/socket'; // ✅ Import getSocket
import api from '../utils/api';
import { useLanguage } from '../utils/LanguageProvider';
import "../styles/dashboard.simple.css";

// Small helper: render avatar from photo url or initials
const Avatar = ({ user, size = 72 }) => {
  const name = user?.name || '';
  const initials = name.split(' ').filter(Boolean).map(s => s[0]).slice(0,2).join('').toUpperCase() || 'DR';
  const photo = user?.photo || user?.avatar || user?.profilePhoto || null;
  const style = {
    width: size,
    height: size,
    borderRadius: '12px',
    background: '#071e24',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    color: '#00ffd0',
    fontSize: Math.round(size / 2.6),
    boxShadow: '0 6px 22px rgba(0,0,0,0.6)',
    border: '1px solid rgba(0,255,208,0.08)'
  };
  if (photo) {
    return <img src={photo} alt={name} style={{ ...style, objectFit: 'cover', borderRadius: 12 }} />;
  }
  return <div style={style}>{initials}</div>;
};

const QueueList = ({ items, onStartCall, onMarkComplete }) => {
  if (!items || items.length === 0) {
    return <div className="simple-card"><p>The patient queue is empty.</p></div>;
  }
  return (
    <div className="simple-card">
      {items.map((item, index) => (
        <div key={item.appointmentId || index} className="queue-item">
          <div className="patient-info">
            <span className="queue-number">{index + 1}</span>
            <span className="patient-name">{item.name}</span>
          </div>
          <div className="actions">
            <button className="btn btn-secondary" onClick={() => onMarkComplete(item.appointmentId)}>Done</button>
            <button className="btn btn-primary" onClick={() => onStartCall(item.patientId, item.appointmentId)}>Start Call</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default function DoctorDashboard() {
  const [activePanel, setActivePanel] = useState("queue");
  const [selectedRecordPatient, setSelectedRecordPatient] = useState(null);
  const [recordsFilter, setRecordsFilter] = useState({ period: 'all', search: '' });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user: currentUser } = useSelector((state) => state.auth);
  const { t } = useLanguage();
  const { queue: patientQueueRaw, attendedPatients: attendedPatientsRaw, loading } = useSelector((state) => state.dashboard);
  const patientQueue = Array.isArray(patientQueueRaw) ? patientQueueRaw : [];
  const attendedPatients = Array.isArray(attendedPatientsRaw) ? attendedPatientsRaw : [];

  // ✅ Get the shared socket instance
  const socket = getSocket();

  useEffect(() => {
    dispatch(fetchDoctorQueue());
    dispatch(fetchAttendedPatients());
  }, [dispatch]);

  // Re-fetch attended patients whenever doctor opens the "attended" panel
  useEffect(() => {
    if (activePanel === "attended") {
      dispatch(fetchAttendedPatients());
    }
  }, [activePanel, dispatch]);

  const handleStartCall = async (patientId, appointmentId) => {
    console.log(`Initializing call with patient: ${patientId}`);

    // Navigate with actual user IDs as URL params for WebRTC
    const actualPatientId = patientId || '68d7ca40958fcc64b35b2dd3'; // Use the real patient ID from logs
    const doctorId = currentUser?.id || currentUser?._id;
    navigate(`/call/${appointmentId}?patientId=${actualPatientId}&doctorId=${doctorId}`);

    // ✅ Emit start-call event
    socket.emit("webrtc:start-call", {
      patientId,
      fromUserName: currentUser?.name || 'Doctor',
      appointmentId,
    });

    // Optional: backend API logging
    try {
      const res = await api.apiFetch('/api/appointments/start-call', {
        method: 'POST',
        body: JSON.stringify({ patientId, appointmentId }),
      });
      if (!res.ok) console.warn('Start-call API returned non-ok status:', res.status);
    } catch (error) {
      console.error("Failed to signal start of call:", error);
    }
  };

  const handleMarkComplete = async (appointmentId) => {
    try {
      await api.apiFetch('/api/appointments/complete', {
        method: 'POST',
        body: JSON.stringify({ appointmentId })
      });
      dispatch(fetchDoctorQueue());
    } catch (error) {
      console.error("Failed to mark appointment as completed:", error);
    }
  };

  // attendedPatients now comes from Redux state (fetched from backend)

  const handleDownloadPrescription = (patient) => {
    const prescriptionsSafe = Array.isArray(patient.prescriptions) ? patient.prescriptions : [];
    const lines = [
      `Patient Name: ${patient.name || patient.patient?.name || 'Unknown'}`,
      `Patient ID: ${patient.id || patient.patient?.id || patient.patient?._id || 'N/A'}`,
      '',
      'Prescriptions:',
      ...prescriptionsSafe.map((presc, i) => (
        `${i + 1}. ${presc.medicine || presc.medication || '—'} - ${presc.dosage || presc.frequency || '—'} (${presc.date || presc.createdAt || '—'})\n   Notes: ${presc.notes || '—'}`
      ))
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(patient.name || patient.patient?.name || 'patient')}_prescription.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const parsePossibleDate = (p) => {
    return p?.attendedAt || p?.date || p?.completedAt || p?.createdAt || p?.appointmentDate || null;
  };

  const isSameDay = (dStr) => {
    if (!dStr) return false;
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return false;
    const today = new Date();
    return d.getFullYear() === today.getFullYear() &&
           d.getMonth() === today.getMonth() &&
           d.getDate() === today.getDate();
  };

  const totalAttended = attendedPatients.length;
  const attendedToday = attendedPatients.filter(p => isSameDay(parsePossibleDate(p))).length;

  const upcomingPreview = patientQueue.slice(0, 6).map((a) => ({
    name: a.patient?.name || a.name || 'Unknown',
    appointmentId: a._id || a.appointmentId,
    time: a.slot || a.time || a.date || ''
  }));

  const renderPanel = () => {
    switch (activePanel) {
      case "dashboard":
        return (
          <div className="simple-card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flex: '1 1 420px' }}>
                <div style={{ marginRight: 12 }}>
                  <Avatar user={currentUser} size={84} />
                </div>
                <div style={{ minWidth: 200 }}>
                  <h3 style={{ marginTop: 0, marginBottom: 6, fontSize: 20 }}>{currentUser?.name || 'Doctor'}</h3>
                  <p style={{ margin: '4px 0', color: '#00ffd0', fontWeight: 600 }}>{currentUser?.specialization || 'General'}</p>
                  <div style={{ marginTop: 6, color: '#cfeee6' }}>
                    <div><strong style={{ color: '#fff' }}>Contact:</strong> {currentUser?.phone || currentUser?.contact || 'N/A'}</div>
                    <div><strong style={{ color: '#fff' }}>Email:</strong> {currentUser?.email || 'N/A'}</div>
                    <div><strong style={{ color: '#fff' }}>Experience:</strong> {currentUser?.experience || 'N/A'}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'stretch' }}>
                <div style={{ background: '#071e24', border: '1px solid #00ffd0', padding: 12, borderRadius: 8, minWidth: 140 }}>
                  <div style={{ color: '#00ffd0', fontSize: 12 }}>Total Attended</div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{totalAttended}</div>
                </div>
                <div style={{ background: '#071e24', border: '1px solid #00ffd0', padding: 12, borderRadius: 8, minWidth: 140 }}>
                  <div style={{ color: '#00ffd0', fontSize: 12 }}>Attended Today</div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{attendedToday}</div>
                </div>
                <div style={{ background: '#071e24', border: '1px solid #00ffd0', padding: 12, borderRadius: 8, minWidth: 140 }}>
                  <div style={{ color: '#00ffd0', fontSize: 12 }}>Waiting</div>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{patientQueue.length}</div>
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid rgba(0,255,208,0.08)', margin: '14px 0' }} />

            <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 420px' }}>
                <h4 style={{ marginTop: 0 }}>Upcoming Patients</h4>
                {upcomingPreview.length === 0 ? (
                  <p>No upcoming patients.</p>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                    {upcomingPreview.map((p, i) => (
                      <li key={p.appointmentId || i} style={{ marginBottom: 8, color: '#fff' }}>
                        <strong>{p.name}</strong>
                        {p.time ? <span style={{ color: '#00ffd0', marginLeft: 8 }}>{p.time}</span> : null}
                        <div style={{ marginTop: 6 }}>
                          <button className="btn btn-primary" style={{ marginRight: 8 }} onClick={() => handleStartCall(null, p.appointmentId)}>Start Call</button>
                          <button className="btn btn-secondary" onClick={() => handleMarkComplete(p.appointmentId)}>Mark Done</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div style={{ width: 320 }}>
                <h4 style={{ marginTop: 0 }}>Recent Attended</h4>
                {attendedPatients.length === 0 ? (
                  <p>No patients attended yet.</p>
                ) : (
                  <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                    {attendedPatients.slice(0, 8).map((p, idx) => (
                      <div key={p._id || p.id || idx} style={{ padding: 8, borderBottom: '1px dashed rgba(255,255,255,0.03)' }}>
                        <div style={{ color: '#00ffd0', fontWeight: 600 }}>{p.patient?.name || p.name || 'Unknown'}</div>
                        <div style={{ color: '#cfeee6', fontSize: 13 }}>
                          {parsePossibleDate(p) ? new Date(parsePossibleDate(p)).toLocaleString() : '—'}
                        </div>
                        {Array.isArray(p.prescriptions) && p.prescriptions.length > 0 && (
                          <div style={{ marginTop: 6 }}>
                            <small style={{ color: '#00ffd0' }}>{p.prescriptions.length} prescription(s)</small>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case "queue":
        return (
          <div>
            <h3>Patient Queue</h3>
            {loading ? <p>Loading queue...</p> : 
              <QueueList 
                items={patientQueue.map(a => ({
                  name: a.patient?.name || 'Unknown',
                  appointmentId: a._id,
                  patientId: a.patient?._id,
                }))} 
                onStartCall={handleStartCall} 
                onMarkComplete={handleMarkComplete} 
              />
            }
          </div>
        );
      case "attended":
        {
          const list = Array.isArray(attendedPatients) ? attendedPatients : [];
          return (
            <div className="simple-card">
              <h3>Attended Patients</h3>
              {list.length === 0 ? (
                <p>No patients attended yet.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
                  <thead>
                    <tr style={{ background: '#0a233a', color: '#00ffd0' }}>
                      <th style={{ border: '1px solid #00ffd0', padding: '8px' }}>Patient ID</th>
                      <th style={{ border: '1px solid #00ffd0', padding: '8px' }}>Name</th>
                      <th style={{ border: '1px solid #00ffd0', padding: '8px' }}>Prescriptions</th>
                      <th style={{ border: '1px solid #00ffd0', padding: '8px' }}>Download</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((p, idx) => {
                      const key = p._id || p.id || (p.patient && (p.patient._id || p.patient.id)) || idx;
                      const prescriptionsSafe = Array.isArray(p.prescriptions) ? p.prescriptions : (Array.isArray(p.patient?.prescriptions) ? p.patient.prescriptions : []);
                      const patientIdDisplay = p.id || p.patient?.id || p.patient?._id || '—';
                      const patientName = p.name || p.patient?.name || 'Unknown';
                      return (
                        <tr key={key} style={{ background: idx % 2 === 0 ? '#18232e' : 'transparent' }}>
                          <td style={{ border: '1px solid #00ffd0', padding: '8px', color: '#fff' }}>{patientIdDisplay}</td>
                          <td style={{ border: '1px solid #00ffd0', padding: '8px', color: '#fff' }}>{patientName}</td>
                          <td style={{ border: '1px solid #00ffd0', padding: '8px', color: '#fff' }}>
                            {prescriptionsSafe.length === 0 ? (
                              <em style={{ color: '#cfeee6' }}>No prescriptions</em>
                            ) : (
                              <ul style={{ margin: 0, paddingLeft: 16 }}>
                                {prescriptionsSafe.map((presc, i) => (
                                  <li key={i}>
                                    <strong>{presc.medicine || presc.medication || '—'}</strong> - {presc.dosage || presc.frequency || '—'} ({presc.date || presc.createdAt || '—'})<br />
                                    <span style={{ fontSize: '0.95em', color: '#00ffd0' }}>{presc.notes || '—'}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </td>
                          <td style={{ border: '1px solid #00ffd0', padding: '8px', color: '#fff', textAlign: 'center' }}>
                            <button className="btn btn-primary" onClick={() => handleDownloadPrescription(p)}>
                              Download Prescription
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          );
        }
      default:
        return <div className="simple-card"><h3>{activePanel}</h3></div>;
    }
  };

  // Records panel: timeline view, filters, and exports
  const renderRecordsPanel = () => {
    const list = Array.isArray(attendedPatients) ? attendedPatients : [];

    // Build flattened visits array
    const visits = [];
    list.forEach((p) => {
      const patientObj = p.patient || p;
      const patientId = patientObj?.id || patientObj?._id || p.id || p._id || '—';
      const patientName = patientObj?.name || p.name || 'Unknown';
      const vlist = Array.isArray(p.visits) ? p.visits : (p.history || p.record?.visits || []);
      if (vlist && vlist.length > 0) {
        vlist.forEach(v => visits.push({ patientId, patientName, visit: v, source: p }));
      } else {
        // treat p as a visit object if it contains timestamp fields
        const maybeDate = p.attendedAt || p.date || p.createdAt || p.visitedAt;
        if (maybeDate) visits.push({ patientId, patientName, visit: p, source: p });
      }
    });

    // Filters
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    let filtered = visits.slice();
    if (recordsFilter.period === 'lastMonth') {
      filtered = filtered.filter(x => {
        const d = new Date(x.visit.date || x.visit.attendedAt || x.visit.createdAt || x.visit.visitedAt);
        return !isNaN(d.getTime()) && d >= oneMonthAgo;
      });
    }
    if (recordsFilter.search && recordsFilter.search.trim() !== '') {
      const q = recordsFilter.search.toLowerCase();
      filtered = filtered.filter(x => (x.patientName || '').toLowerCase().includes(q) || (x.visit.complaints || x.visit.reason || x.visit.symptoms || '').toLowerCase().includes(q));
    }

    const exportPatientTimelineTxt = (patientId) => {
      const pVisits = visits.filter(v => v.patientId === patientId);
      const lines = [];
      lines.push(`Patient Timeline - ${pVisits[0]?.patientName || patientId}`);
      lines.push(`Patient ID: ${patientId}`);
      lines.push('----------------------------------------');
      pVisits.forEach((pv, i) => {
        const v = pv.visit;
        const when = v.date || v.attendedAt || v.createdAt || v.visitedAt || '—';
        const doctors = v.doctors ? (Array.isArray(v.doctors) ? v.doctors.join(', ') : v.doctors) : (v.doctor?.name || v.doctor || '—');
        const complaints = v.complaints || v.reason || v.symptoms || '—';
        const meds = Array.isArray(v.prescriptions) ? v.prescriptions.map(pp => `${pp.medicine || pp.medication || pp.name || '—'} (${pp.dosage || pp.frequency || '—'})`).join('; ') : (v.prescriptions || '—');
        lines.push(`${i+1}. Date: ${when}`);
        lines.push(`   Doctors: ${doctors}`);
        lines.push(`   Complaints: ${complaints}`);
        lines.push(`   Medications: ${meds}`);
        lines.push('');
      });
      const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(pVisits[0]?.patientName || patientId).replace(/\s+/g, '_')}_timeline.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    return (
      <div className="simple-card">
        <h3>Digital Records - Timeline</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <select value={recordsFilter.period} onChange={(e) => setRecordsFilter(f => ({ ...f, period: e.target.value }))}>
            <option value="all">All time</option>
            <option value="lastMonth">Last month</option>
          </select>
          <input placeholder="Search patient or complaint" style={{ flex: 1 }} value={recordsFilter.search} onChange={(e) => setRecordsFilter(f => ({ ...f, search: e.target.value }))} />
          <button className="btn btn-secondary" onClick={() => { setRecordsFilter({ period: 'all', search: '' }); }}>Clear</button>
        </div>

        {filtered.length === 0 ? (
          <p>No visits match the current filter.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0a233a', color: '#00ffd0' }}>
                  <th style={{ border: '1px solid #00ffd0', padding: 8 }}>Patient ID</th>
                  <th style={{ border: '1px solid #00ffd0', padding: 8 }}>Name</th>
                  <th style={{ border: '1px solid #00ffd0', padding: 8 }}>Visit Date</th>
                  <th style={{ border: '1px solid #00ffd0', padding: 8 }}>Doctor(s)</th>
                  <th style={{ border: '1px solid #00ffd0', padding: 8 }}>Complaints</th>
                  <th style={{ border: '1px solid #00ffd0', padding: 8 }}>Medications</th>
                  <th style={{ border: '1px solid #00ffd0', padding: 8 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, idx) => {
                  const key = `${row.patientId}-${idx}`;
                  const when = row.visit.date || row.visit.attendedAt || row.visit.createdAt || row.visit.visitedAt || '—';
                  const doctors = row.visit.doctors ? (Array.isArray(row.visit.doctors) ? row.visit.doctors.join(', ') : row.visit.doctors) : (row.visit.doctor?.name || row.visit.doctor || '—');
                  const complaints = row.visit.complaints || row.visit.reason || row.visit.symptoms || '—';
                  const medsArr = Array.isArray(row.visit.prescriptions) ? row.visit.prescriptions.map(x => `${x.medicine || x.medication || x.name || '—'} (${x.dosage || x.frequency || '—'})`) : (row.visit.prescriptions ? [String(row.visit.prescriptions)] : []);
                  const meds = medsArr.join('; ') || '—';
                  return (
                    <tr key={key} style={{ background: idx % 2 === 0 ? '#18232e' : 'transparent' }}>
                      <td style={{ border: '1px solid #00ffd0', padding: 8, color: '#fff' }}>{row.patientId}</td>
                      <td style={{ border: '1px solid #00ffd0', padding: 8, color: '#fff' }}>{row.patientName}</td>
                      <td style={{ border: '1px solid #00ffd0', padding: 8, color: '#fff' }}>{when}</td>
                      <td style={{ border: '1px solid #00ffd0', padding: 8, color: '#fff' }}>{doctors}</td>
                      <td style={{ border: '1px solid #00ffd0', padding: 8, color: '#fff' }}>{complaints}</td>
                      <td style={{ border: '1px solid #00ffd0', padding: 8, color: '#fff' }}>{meds}</td>
                      <td style={{ border: '1px solid #00ffd0', padding: 8, color: '#fff', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button className="btn btn-secondary" onClick={() => exportPatientTimelineTxt(row.patientId)}>Export Timeline (TXT)</button>
                          <button className="btn btn-primary" onClick={() => setSelectedRecordPatient(row.source)}>View Details</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {selectedRecordPatient && (
          <div style={{ marginTop: 16 }}>
            <h4>Record details for {selectedRecordPatient.patient?.name || selectedRecordPatient.name || 'Selected'}</h4>
            <pre style={{ whiteSpace: 'pre-wrap', color: '#cfeee6', background: '#071e24', padding: 12, borderRadius: 8 }}>
              {JSON.stringify(selectedRecordPatient, null, 2)}
            </pre>
            <div style={{ marginTop: 8 }}>
              <button className="btn btn-secondary" onClick={() => exportPatientTimelineTxt(selectedRecordPatient.patient?.id || selectedRecordPatient.patient?._id || selectedRecordPatient.id || selectedRecordPatient._id)}>Export Timeline (TXT)</button>
              <button className="btn btn-outline" style={{ marginLeft: 8 }} onClick={() => setSelectedRecordPatient(null)}>Close</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const sidebarItems = [
    { key: "dashboard", label: "Dashboard" },
    { key: "queue", label: "Patient Queue" },
    { key: "attended", label: "Attended Patients" },
    { key: "records", label: "Digital Records" },
  ];

  // Make the main content occupy full available height and width for a spacious layout
  return (
    <DashboardLayout
      title={currentUser?.name || 'Doctor'}
      subtitle={currentUser?.specialization || 'Dashboard'}
      currentUser={currentUser}
      sidebarItems={sidebarItems}
      activeKey={activePanel}
      onSelect={setActivePanel}
      onRefresh={() => { dispatch(fetchDoctorQueue()); dispatch(fetchAttendedPatients()); }}
      quickActions={[
        { label: t('refreshQueue'), variant: 'primary', onClick: () => dispatch(fetchDoctorQueue()) },
        { label: t('refreshRecords'), variant: 'outline', onClick: () => dispatch(fetchAttendedPatients()) }
      ]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minHeight: '80vh', width: '100%' }}>
        <div style={{ width: '100%' }}>
          {activePanel === 'records' ? renderRecordsPanel() : renderPanel()}
        </div>

        {/* Extra section: fill the page with useful panels */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18, alignItems: 'start' }}>
          <div>
            <div className="simple-card" style={{ marginBottom: 18 }}>
              <h4>{t('todaysSchedule')}</h4>
              {patientQueue.length === 0 ? (
                <p>{t('noAppointmentsToday')}</p>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {patientQueue.map((a, i) => (
                    <li key={a._id || i} style={{ marginBottom: 10 }}>
                      <strong>{a.patient?.name || a.name || 'Unknown'}</strong>
                      <div style={{ color: '#cfeee6', fontSize: 13 }}>{a.slot || a.time || a.date || 'Time not set'}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="simple-card">
              <h4>{t('activityFeed')}</h4>
              <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                {/* Use recent attended entries as a simple activity feed */}
                {attendedPatients.length === 0 ? (
                  <p>{t('noRecentActivity')}</p>
                ) : (
                  attendedPatients.slice(0, 10).map((p, idx) => (
                    <div key={p._id || idx} style={{ padding: 10, borderBottom: '1px dashed rgba(255,255,255,0.03)' }}>
                      <div style={{ color: '#00ffd0', fontWeight: 600 }}>{p.patient?.name || p.name || 'Unknown'}</div>
                      <div style={{ color: '#cfeee6', fontSize: 13 }}>{parsePossibleDate(p) ? new Date(parsePossibleDate(p)).toLocaleString() : '—'}</div>
                      <div style={{ marginTop: 6, color: '#cfeee6' }}>{(p.note || p.summary || (p.prescriptions && p.prescriptions.length > 0 ? `${p.prescriptions.length} prescription(s)` : t('visited')))}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="simple-card">
              <h4>{t('announcements')}</h4>
              <div style={{ color: '#cfeee6' }}>
                <p style={{ marginTop: 0 }}>{t('noAnnouncements')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
