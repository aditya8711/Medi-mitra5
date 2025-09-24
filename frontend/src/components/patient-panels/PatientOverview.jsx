import React from 'react';
import '../../styles/patient-overview.premium.css';
import { useLanguage } from '../../utils/LanguageProvider';

const compactDate = (d) => {
  try {
    return new Date(d).toLocaleDateString();
  } catch (e) {
    return d || '-';
  }
};

const PatientOverview = ({ user, setActivePanel, appointments = [], prescriptions = [], currentMedicines = [] }) => {
  const upcoming = (appointments || [])
    .filter(a => a && a.date)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  const recentPrescriptions = (prescriptions || []).slice(0, 3);

  const { t } = useLanguage();

  return (
    <div>
      <div className="premium-card premium-header">
        <div>
          <div className="premium-title">{t('patientDashboard').replace('Dashboard','') || `Hello, ${user?.name || 'Patient'}!`}</div>
          <div className="premium-subtitle">{user?.uniqueId ? `ID: ${user.uniqueId}` : ''}</div>
        </div>
        <div>
          <span className="badge">Patient</span>
        </div>
      </div>

      <div className="premium-card premium-overview" style={{ marginTop: 14 }}>
        <div>
          <div className="detail-item">
            <strong>{t('patientDetails')}</strong>
            <div className="details-grid">
              <div className="detail-item"><strong>{t('nameLabel')}</strong><div>{user?.name || '-'}</div></div>
              <div className="detail-item"><strong>{t('uniqueIdLabel')}</strong><div>{user?.uniqueId || '-'}</div></div>
              <div className="detail-item"><strong>{t('ageLabel')}</strong><div>{user?.age ?? '-'}</div></div>
              <div className="detail-item"><strong>{t('genderLabel')}</strong><div>{user?.gender || '-'}</div></div>
              <div className="detail-item"><strong>{t('contactLabel')}</strong><div>{user?.phone || user?.email || '-'}</div></div>
              <div className="detail-item"><strong>{t('emergencyLabel')}</strong><div>{user?.emergencyContact || '-'}</div></div>
              <div className="detail-item" style={{ gridColumn: '1 / -1' }}><strong>{t('addressLabel')}</strong><div>{user?.address || '-'}</div></div>
            </div>
          </div>
        </div>

        <div>
          <div className="detail-item">
            <strong>Health Snapshot</strong>
            <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
              <div className="detail-item"><div className="badge">{currentMedicines?.length || 0}</div><div style={{ fontSize: 12 }}>{t('activeMedicines')}</div></div>
              <div className="detail-item"><div className="badge">{appointments?.length || 0}</div><div style={{ fontSize: 12 }}>{t('appointmentsLabel')}</div></div>
              <div className="detail-item"><div className="badge">{prescriptions?.length || 0}</div><div style={{ fontSize: 12 }}>{t('prescriptionsLabel')}</div></div>
            </div>

            <div className="actions-row">
              <button className="btn" onClick={() => setActivePanel("book")}>{t('bookAppointmentBtn') || t('book')}</button>
              <button className="btn" onClick={() => setActivePanel("records")}>{t('viewRecordsBtn') || t('records')}</button>
              <button className="btn" onClick={() => setActivePanel("medicines")}>{t('medicineTrackerBtn') || t('medicineTrackerTitle')}</button>
              <button className="btn" onClick={() => setActivePanel("symptoms")}>{t('symptomCheckerTitle')}</button>
            </div>
          </div>

          <div style={{ marginTop: 12 }} className="detail-item">
            <strong>Recent Prescriptions</strong>
            <div className="prescription-list" style={{ marginTop: 8 }}>
              {recentPrescriptions.length > 0 ? (
                recentPrescriptions.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>{p.medicationName || p.name || 'Prescription'}</div>
                    <div style={{ color: '#6b7280' }}>{compactDate(p.date)}</div>
                  </div>
                ))
              ) : (
                <div>No recent prescriptions.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="premium-card" style={{ marginTop: 14 }}>
        <strong>Upcoming Appointments</strong>
        <div className="upcoming-list" style={{ marginTop: 8 }}>
          {upcoming.length > 0 ? (
            upcoming.map((a, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>{a.doctorName ? `Dr. ${a.doctorName}` : 'Doctor' }{a.reason ? ` — ${a.reason}` : ''}</div>
                <div style={{ color: '#6b7280' }}>{compactDate(a.date)}</div>
              </div>
            ))
          ) : (
            <div>No upcoming appointments.</div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        {/* SymptomChecker moved to its own panel - open via Quick Actions */}
      </div>
    </div>
  );
};

export default PatientOverview;
