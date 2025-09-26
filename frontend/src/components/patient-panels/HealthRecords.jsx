import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../utils/LanguageProvider';
import api from '../../utils/api';

const HealthRecords = ({ initialPrescriptions = null, initialPatient = null }) => {
  const { t } = useLanguage();
  const [patient, setPatient] = useState(initialPatient);
  const [prescriptions, setPrescriptions] = useState(initialPrescriptions);
  const [loading, setLoading] = useState(!initialPatient || !initialPrescriptions);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If we already have both, don't fetch
    if (patient && prescriptions) {
      setLoading(false);
      return;
    }

    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [meRes, presRes] = await Promise.all([
          api.apiFetch('/api/auth/me'),
          api.apiFetch('/api/prescriptions')
        ]);

        if (!mounted) return;

        if (meRes.ok && meRes.data?.user) {
          setPatient({
            name: meRes.data.user.name || 'Unknown',
            id: meRes.data.user.uniqueId || meRes.data.user.id || 'N/A',
            age: meRes.data.user.age || 'N/A',
            gender: meRes.data.user.gender || 'N/A',
            contact: meRes.data.user.phone || meRes.data.user.email || 'N/A'
          });
        }

        if (presRes.ok) {
          setPrescriptions(presRes.data || []);
        } else {
          setPrescriptions([]);
        }

        setError(null);
      } catch (err) {
        console.error('Failed to fetch health records', err);
        setError('Failed to load data.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, []);

  const hasPrescriptions = prescriptions && prescriptions.length > 0;

  const handleDownloadPrescription = (presc, idx) => {
    // Create a nicer formatted text file for download
    const date = presc.date || (presc.createdAt ? new Date(presc.createdAt).toLocaleDateString() : '');
    const docName = presc.doctor?.name || presc.doctor || 'N/A';
    const lines = [
      `Prescription - ${date}`,
      '----------------------------------------',
      `Patient: ${patient?.name || 'N/A'} (${patient?.id || 'N/A'})`,
      `Doctor: ${docName}`,
      '',
      `Medicine: ${presc.medicine || ''}`,
      `Dosage: ${presc.dosage || ''}`,
      '',
      `Notes: ${presc.notes || 'No notes provided.'}`,
      '',
      'Powered by Medi-mitra'
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

      <div style={{
        background: '#07202a',
        color: '#00ffd0',
        borderRadius: '18px',
        boxShadow: '0 8px 40px rgba(0,255,208,0.08)',
        margin: '28px auto',
        padding: '30px 36px',
        display: 'flex',
        alignItems: 'center',
        maxWidth: '960px',
        border: '2px solid #00ffd0',
        position: 'relative'
      }}>
        <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="avatar" style={{ width: 120, height: 120, borderRadius: '50%', marginRight: '36px', background: '#fff' }} />
        <div>
          <div style={{ fontSize: '2.6rem', fontWeight: '700', color: '#00ffd0', marginBottom: 6 }}>{patient?.name || 'Patient'}</div>
          <div style={{ fontSize: '1.05rem', color: '#cfeee6', marginBottom: 6 }}>ID: <span style={{ color: '#00ffd0' }}>{patient?.id || 'N/A'}</span></div>
          <div style={{ fontSize: '1.05rem', color: '#cfeee6', marginBottom: 6 }}>Age: <span style={{ color: '#00ffd0' }}>{patient?.age || 'N/A'}</span></div>
          <div style={{ fontSize: '1.05rem', color: '#cfeee6', marginBottom: 6 }}>Gender: <span style={{ color: '#00ffd0' }}>{patient?.gender || 'N/A'}</span></div>
          <div style={{ fontSize: '1.05rem', color: '#cfeee6' }}>Contact: <span style={{ color: '#00ffd0' }}>{patient?.contact || 'N/A'}</span></div>
        </div>
      </div>

      <div style={{
        background: '#0d1416',
        borderRadius: '10px',
        boxShadow: '0 6px 26px rgba(0,0,0,0.6)',
        padding: '18px',
        border: '1.5px solid #00ffd0',
        maxWidth: '960px',
        margin: '12px auto'
      }}>
        <h4 style={{ color: '#00ffd0', marginBottom: '12px' }}>{t('myPrescriptions')}</h4>

        {loading ? (
          <div style={{ color: '#fff', padding: '16px' }}>Loading...</div>
        ) : error ? (
          <div style={{ color: '#ff6b6b', padding: '16px' }}>{error}</div>
        ) : hasPrescriptions ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem' }}>
            <thead>
              <tr style={{ background: '#07202a' }}>
                <th style={{ border: '1px solid #00ffd0', padding: '12px', color: '#00ffd0', fontWeight: '700' }}>Medicine</th>
                <th style={{ border: '1px solid #00ffd0', padding: '12px', color: '#00ffd0', fontWeight: '700' }}>Dosage</th>
                <th style={{ border: '1px solid #00ffd0', padding: '12px', color: '#00ffd0', fontWeight: '700' }}>Date</th>
                <th style={{ border: '1px solid #00ffd0', padding: '12px', color: '#00ffd0', fontWeight: '700' }}>Doctor</th>
                <th style={{ border: '1px solid #00ffd0', padding: '12px', color: '#00ffd0', fontWeight: '700' }}>Notes</th>
                <th style={{ border: '1px solid #00ffd0', padding: '12px', color: '#00ffd0', fontWeight: '700' }}>Download</th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.map((rec, idx) => (
                <tr key={rec._id || idx} style={{ background: idx % 2 === 0 ? '#0f2227' : 'transparent' }}>
                  <td style={{ border: '1px solid #00ffd0', padding: '12px', color: '#fff' }}>{rec.medicine || rec.medication || ''}</td>
                  <td style={{ border: '1px solid #00ffd0', padding: '12px', color: '#fff' }}>{rec.dosage || rec.frequency || ''}</td>
                  <td style={{ border: '1px solid #00ffd0', padding: '12px', color: '#fff' }}>{rec.date || (rec.createdAt ? new Date(rec.createdAt).toLocaleDateString() : '')}</td>
                  <td style={{ border: '1px solid #00ffd0', padding: '12px', color: '#fff' }}>{rec.doctor?.name || rec.doctor || 'N/A'}</td>
                  <td style={{ border: '1px solid #00ffd0', padding: '12px', color: '#fff' }}>{rec.notes || 'No notes provided.'}</td>
                  <td style={{ border: '1px solid #00ffd0', padding: '12px', color: '#00ffd0', textAlign: 'center' }}>
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
