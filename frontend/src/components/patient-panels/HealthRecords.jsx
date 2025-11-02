import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../utils/LanguageProvider';
import api from '../../utils/api';

const normalizePrescriptions = (raw = []) => {
  if (!Array.isArray(raw)) return [];
  return raw.map((prescription, index) => {
    const id = prescription.id || prescription._id || `prescription-${index}`;
    const createdAt = prescription.createdAt || prescription.date || prescription.updatedAt || null;
    const doctorName = typeof prescription.doctor === 'string'
      ? prescription.doctor
      : prescription.doctor?.name || prescription.doctorName || '';
    const medicines = Array.isArray(prescription.medicines)
      ? prescription.medicines.map((med, medIdx) => ({
          id: med.id || med._id || `${id}-med-${medIdx}`,
          name: med.name || med.medicine || '',
          dosage: med.dosage || '',
          frequency: med.frequency || '',
          duration: med.duration || '',
        }))
      : [];

    return {
      id,
      createdAt,
      updatedAt: prescription.updatedAt || prescription.createdAt || null,
      doctorName,
      notes: prescription.notes || '',
      nextVisit: prescription.nextVisit || '',
      medicines,
    };
  });
};

const HealthRecords = ({
  prescriptions: initialPrescriptions = null,
  patient: initialPatient = null,
  latestPrescriptionAt = null,
}) => {
  const { t } = useLanguage();
  const [patient, setPatient] = useState(initialPatient);
  const [prescriptions, setPrescriptions] = useState(
    initialPrescriptions ? normalizePrescriptions(initialPrescriptions) : null
  );
  const [loading, setLoading] = useState(!initialPatient || !initialPrescriptions);
  const [error, setError] = useState(null);
  const [showNewBanner, setShowNewBanner] = useState(false);
  const [latestPrescriptionStamp, setLatestPrescriptionStamp] = useState(
    latestPrescriptionAt ? new Date(latestPrescriptionAt).toISOString() : null
  );

  useEffect(() => {
    if (initialPatient) {
      setPatient(initialPatient);
    }
  }, [initialPatient]);

  useEffect(() => {
    if (initialPrescriptions) {
      setPrescriptions(normalizePrescriptions(initialPrescriptions));
      setLoading(false);
    }
  }, [initialPrescriptions]);

  useEffect(() => {
    if (latestPrescriptionAt) {
      setLatestPrescriptionStamp(new Date(latestPrescriptionAt).toISOString());
    }
  }, [latestPrescriptionAt]);

  useEffect(() => {
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
          const user = meRes.data.user;
          setPatient({
            name: user.name || 'Unknown',
            id: user.uniqueId || user.id || 'N/A',
            age: user.age || 'N/A',
            gender: user.gender || 'N/A',
            contact: user.phone || user.email || 'N/A',
          });
        }

        if (presRes.ok) {
          setPrescriptions(normalizePrescriptions(presRes.data || []));
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
  }, [patient, prescriptions]);

  const hasPrescriptions = Array.isArray(prescriptions) && prescriptions.length > 0;

  useEffect(() => {
    if (!hasPrescriptions) {
      setShowNewBanner(false);
      setLatestPrescriptionStamp(null);
      return;
    }

    const latest = prescriptions.reduce((memo, pres) => {
      if (!pres.createdAt) return memo;
      const stamp = new Date(pres.createdAt).toISOString();
      if (!memo) return stamp;
      return new Date(stamp) > new Date(memo) ? stamp : memo;
    }, null);

    setLatestPrescriptionStamp(latest);

    if (typeof window === 'undefined') return;

    try {
      const seen = window.localStorage.getItem('mm_prescription_last_seen');
      if (!seen || (latest && new Date(latest) > new Date(seen))) {
        setShowNewBanner(true);
      } else {
        setShowNewBanner(false);
      }
    } catch (err) {
      console.warn('localStorage unavailable', err);
    }
  }, [hasPrescriptions, prescriptions]);

  const markPrescriptionsAsSeen = () => {
    if (!latestPrescriptionStamp || typeof window === 'undefined') {
      setShowNewBanner(false);
      return;
    }

    try {
      window.localStorage.setItem('mm_prescription_last_seen', latestPrescriptionStamp);
    } catch (err) {
      console.warn('Unable to persist prescription seen state', err);
    }
    setShowNewBanner(false);
    try {
      window.dispatchEvent(new CustomEvent('mm:prescriptions-seen', { detail: latestPrescriptionStamp }));
    } catch (err) {
      console.warn('Unable to dispatch prescriptions-seen event', err);
    }
  };

  const tableRows = useMemo(() => {
    if (!Array.isArray(prescriptions)) return [];
    return prescriptions.flatMap((prescription) => {
      const formattedDate = prescription.createdAt
        ? new Date(prescription.createdAt).toLocaleDateString()
        : '';
      const isNewest = latestPrescriptionStamp
        ? prescription.createdAt && new Date(prescription.createdAt).toISOString() === latestPrescriptionStamp
        : false;

      if (!prescription.medicines.length) {
        return [{
          key: `${prescription.id}-empty`,
          medicine: '-',
          dosage: '-',
          frequency: '-',
          duration: '-',
          date: formattedDate,
          doctor: prescription.doctorName || 'N/A',
          notes: prescription.notes || 'No notes provided.',
          nextVisit: prescription.nextVisit || '-',
          isNew: isNewest,
          prescription,
        }];
      }

      return prescription.medicines.map((med, idx) => ({
        key: `${prescription.id}-${med.id || idx}`,
        medicine: med.name || '-',
        dosage: med.dosage || '-',
        frequency: med.frequency || '-',
        duration: med.duration || '-',
        date: formattedDate,
        doctor: prescription.doctorName || 'N/A',
        notes: prescription.notes || 'No notes provided.',
        nextVisit: prescription.nextVisit || '-',
        isNew: isNewest && idx === 0,
        prescription,
      }));
    });
  }, [latestPrescriptionStamp, prescriptions]);

  const handleDownloadPrescription = (prescription, idx) => {
    const date = prescription.createdAt ? new Date(prescription.createdAt).toLocaleString() : '';
    const lines = [
      `Prescription Date: ${date}`,
      `Doctor: ${prescription.doctorName || 'N/A'}`,
      `Next Visit: ${prescription.nextVisit || '-'}`,
      '',
      `Patient: ${patient?.name || 'N/A'} (${patient?.id || 'N/A'})`,
      '----------------------------------------',
      'Medicines:',
    ];

    if (prescription.medicines.length) {
      prescription.medicines.forEach((med, medIdx) => {
        lines.push(`${medIdx + 1}. ${med.name || '-'} | Dosage: ${med.dosage || '-'} | Frequency: ${med.frequency || '-'} | Duration: ${med.duration || '-'}`);
      });
    } else {
      lines.push('No medicines were recorded.');
    }

    lines.push('', `Notes: ${prescription.notes || 'No notes provided.'}`, '', 'Powered by Medi-mitra');

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

      {showNewBanner && latestPrescriptionStamp && (
        <div style={{
          maxWidth: '960px',
          margin: '12px auto',
          padding: '14px 18px',
          borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.28))',
          border: '1px solid rgba(16,185,129,0.45)',
          color: '#d1fae5',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
        }}>
          <div>
            <div style={{ fontWeight: 600, color: '#34d399' }}>New prescription available</div>
            <div style={{ fontSize: 13, color: '#a7f3d0' }}>Added on {new Date(latestPrescriptionStamp).toLocaleString()}</div>
          </div>
          <button
            className="btn"
            onClick={markPrescriptionsAsSeen}
            style={{ background: 'rgba(16,185,129,0.25)', borderColor: 'rgba(110,231,183,0.5)', color: '#ecfdf5' }}
          >
            Mark as seen
          </button>
        </div>
      )}

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
                <th style={{ border: '1px solid #00ffd0', padding: '12px', color: '#00ffd0', fontWeight: '700' }}>Frequency</th>
                <th style={{ border: '1px solid #00ffd0', padding: '12px', color: '#00ffd0', fontWeight: '700' }}>Duration</th>
                <th style={{ border: '1px solid #00ffd0', padding: '12px', color: '#00ffd0', fontWeight: '700' }}>Date</th>
                <th style={{ border: '1px solid #00ffd0', padding: '12px', color: '#00ffd0', fontWeight: '700' }}>Doctor</th>
                <th style={{ border: '1px solid #00ffd0', padding: '12px', color: '#00ffd0', fontWeight: '700' }}>Notes</th>
                <th style={{ border: '1px solid #00ffd0', padding: '12px', color: '#00ffd0', fontWeight: '700' }}>Next Visit</th>
                <th style={{ border: '1px solid #00ffd0', padding: '12px', color: '#00ffd0', fontWeight: '700' }}>Download</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, idx) => (
                <tr
                  key={row.key}
                  style={{
                    background: row.isNew ? 'rgba(34,197,94,0.08)' : idx % 2 === 0 ? '#0f2227' : 'transparent',
                    transition: 'background 0.3s ease',
                  }}
                >
                  <td style={{ border: '1px solid #00ffd0', padding: '12px', color: '#fff', fontWeight: row.isNew ? 600 : 400 }}>
                    {row.medicine}
                  </td>
                  <td style={{ border: '1px solid #00ffd0', padding: '12px', color: '#fff' }}>{row.dosage}</td>
                  <td style={{ border: '1px solid #00ffd0', padding: '12px', color: '#fff' }}>{row.frequency}</td>
                  <td style={{ border: '1px solid #00ffd0', padding: '12px', color: '#fff' }}>{row.duration}</td>
                  <td style={{ border: '1px solid #00ffd0', padding: '12px', color: '#fff', whiteSpace: 'nowrap' }}>
                    {row.date}
                    {row.isNew && (
                      <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 999, background: '#22c55e', color: '#03271e', fontSize: 12 }}>New</span>
                    )}
                  </td>
                  <td style={{ border: '1px solid #00ffd0', padding: '12px', color: '#fff' }}>{row.doctor}</td>
                  <td style={{ border: '1px solid #00ffd0', padding: '12px', color: '#fff' }}>{row.notes}</td>
                  <td style={{ border: '1px solid #00ffd0', padding: '12px', color: '#fff' }}>{row.nextVisit}</td>
                  <td style={{ border: '1px solid #00ffd0', padding: '12px', color: '#00ffd0', textAlign: 'center' }}>
                    <button className="btn btn-primary" onClick={() => handleDownloadPrescription(row.prescription, idx)}>
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
