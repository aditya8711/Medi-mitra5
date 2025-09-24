import React from 'react';
import { useLanguage } from '../../utils/LanguageProvider';

const demoRecords = [
  { medicine: "Paracetamol", dosage: "500mg", date: "2025-09-01", doctor: "Dr. Singh", notes: "Fever, take after food" },
  { medicine: "Amoxicillin", dosage: "250mg", date: "2025-08-20", doctor: "Dr. Kaur", notes: "Infection, complete full course" },
  { medicine: "Ibuprofen", dosage: "200mg", date: "2025-07-15", doctor: "Dr. Sharma", notes: "Pain relief, max 3/day" },
];

const demoPatient = {
  name: "John",
  id: "P-20250914-9443",
  age: "N/A",
  gender: "N/A",
  contact: "9569695329",
};

const HealthRecords = ({ prescriptions, patient = demoPatient }) => {
  const { t } = useLanguage();
  const hasPrescriptions = prescriptions && prescriptions.length > 0;

  const handleDownloadPrescription = (presc, idx) => {
    const lines = [
      `Medicine: ${presc.medicine}`,
      `Dosage: ${presc.dosage}`,
      `Date: ${presc.date || (presc.createdAt ? new Date(presc.createdAt).toLocaleDateString() : '')}`,
      `Doctor: ${presc.doctor || (presc.doctor?.name || 'N/A')}`,
      `Notes: ${presc.notes || 'No notes provided.'}`
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prescription_${idx + 1}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h2 style={{ color: '#00ffd0', marginBottom: 0 }}>{t('patientDetails') || 'Health Records'}</h2>
      <div className="health-card-gradient" style={{
        background: '#0a233a',
        color: '#00ffd0',
        borderRadius: '20px',
        boxShadow: '0 4px 32px #00ffd055',
        margin: '32px auto 32px auto',
        padding: '40px 48px',
        display: 'flex',
        alignItems: 'center',
        maxWidth: '900px',
        minHeight: '220px',
        border: '2px solid #00ffd0',
        position: 'relative',
        justifyContent: 'flex-start',
      }}>
        <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="avatar" style={{ width: 110, height: 110, borderRadius: '50%', marginRight: '40px', background: '#fff', boxShadow: '0 2px 12px #00ffd033' }} />
        <div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#00ffd0', marginBottom: 10 }}>{patient.name}</div>
          <div style={{ fontSize: '1.2rem', color: '#fff', marginBottom: 8 }}>ID: <span style={{ color: '#00ffd0' }}>{patient.id}</span></div>
          <div style={{ fontSize: '1.2rem', color: '#fff', marginBottom: 8 }}>Age: <span style={{ color: '#00ffd0' }}>{patient.age}</span></div>
          <div style={{ fontSize: '1.2rem', color: '#fff', marginBottom: 8 }}>Gender: <span style={{ color: '#00ffd0' }}>{patient.gender}</span></div>
          <div style={{ fontSize: '1.2rem', color: '#fff', marginBottom: 8 }}>Contact: <span style={{ color: '#00ffd0' }}>{patient.contact}</span></div>
        </div>
      </div>
      <div className="health-table-card" style={{
        background: '#10181f',
        borderRadius: '12px',
        boxShadow: '0 2px 12px #00ffd033',
        padding: '18px',
        border: '1.5px solid #00ffd0',
        maxWidth: '98%',
      }}>
  <h4 style={{ color: '#00ffd0', marginBottom: '12px' }}>{t('myPrescriptions')}</h4>
        {hasPrescriptions ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem', background: 'transparent' }}>
            <thead>
              <tr style={{ background: '#0a233a' }}>
                <th style={{ border: '1px solid #00ffd0', padding: '10px', color: '#00ffd0', fontWeight: 'bold' }}>Medicine</th>
                <th style={{ border: '1px solid #00ffd0', padding: '10px', color: '#00ffd0', fontWeight: 'bold' }}>Dosage</th>
                <th style={{ border: '1px solid #00ffd0', padding: '10px', color: '#00ffd0', fontWeight: 'bold' }}>Date</th>
                <th style={{ border: '1px solid #00ffd0', padding: '10px', color: '#00ffd0', fontWeight: 'bold' }}>Doctor</th>
                <th style={{ border: '1px solid #00ffd0', padding: '10px', color: '#00ffd0', fontWeight: 'bold' }}>Notes</th>
                <th style={{ border: '1px solid #00ffd0', padding: '10px', color: '#00ffd0', fontWeight: 'bold' }}>Download</th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.map((rec, idx) => (
                <tr key={idx} style={{ background: idx % 2 === 0 ? '#18232e' : 'transparent', transition: 'background 0.2s' }}>
                  <td style={{ border: '1px solid #00ffd0', padding: '10px', color: '#fff' }}>{rec.medicine || ''}</td>
                  <td style={{ border: '1px solid #00ffd0', padding: '10px', color: '#fff' }}>{rec.dosage || ''}</td>
                  <td style={{ border: '1px solid #00ffd0', padding: '10px', color: '#fff' }}>{rec.date || (rec.createdAt ? new Date(rec.createdAt).toLocaleDateString() : '')}</td>
                  <td style={{ border: '1px solid #00ffd0', padding: '10px', color: '#fff' }}>{rec.doctor || (rec.doctor?.name || 'N/A')}</td>
                  <td style={{ border: '1px solid #00ffd0', padding: '10px', color: '#fff' }}>{rec.notes || 'No notes provided.'}</td>
                  <td style={{ border: '1px solid #00ffd0', padding: '10px', color: '#00ffd0', textAlign: 'center' }}>
                    <button className="btn btn-primary" onClick={() => handleDownloadPrescription(rec, idx)}>
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ color: '#fff', padding: '16px' }}>{t('noPrescriptionsFound')}</div>
        )}
      </div>
    </div>
  );
};

export default HealthRecords;
