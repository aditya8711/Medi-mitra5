import React, { useState } from "react";
import { useLanguage } from '../../utils/LanguageProvider';

const fmt = (d) => {
  try {
    return new Date(d).toLocaleDateString();
  } catch (e) {
    return d || '-';
  }
};

export default function MedicineTracker({ currentMedicines = [], previousMedicines = [] }) {
  // track taken status locally for UI feedback
  const [takenMap, setTakenMap] = useState(() => {
    const map = {};
    (currentMedicines || []).forEach((m, i) => {
      map[m.id || `${m.name}-${i}`] = false;
    });
    return map;
  });

  const toggleTaken = (id) => {
    setTakenMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const { t } = useLanguage();

  return (
    <div className="simple-card">
      <h3>Medicine Tracker</h3>

      <section>
        <h4>{t('currentMedicinesTitle')}</h4>
        {currentMedicines && currentMedicines.length > 0 ? (
          <div style={{ display: 'grid', gap: 12 }}>
            {currentMedicines.map((med, idx) => {
              const id = med.id || `${med.name}-${idx}`;
              return (
                <div key={id} className="medicine-card" style={{ border: '1px solid #eee', padding: 12, borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{med.name}</strong>
                      <div style={{ fontSize: 13, color: '#444' }}>{med.dosage} — {med.frequency}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, textAlign: 'right' }}>
                        {t('prescriber')}: {med.prescriber || med.doctor || '-'}
                      </div>
                      <div style={{ fontSize: 12, color: '#666' }}>From {fmt(med.startDate)} to {fmt(med.endDate)}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 13 }}>{med.notes || ''}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button className="btn" onClick={() => toggleTaken(id)}>{takenMap[id] ? t('taken') : t('markTaken')}</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p>No current medicines prescribed.</p>
        )}
      </section>

      <section style={{ marginTop: "1.5em" }}>
  <h4>{t('previousMedicinesTitle')}</h4>
        {previousMedicines && previousMedicines.length > 0 ? (
          <ul>
            {previousMedicines.map((med, idx) => (
              <li key={idx}>
                <strong>{med.name}</strong> - {med.dosage} ({med.frequency}) — {t('fromLabel')} {fmt(med.startDate)} {t('toLabel')} {fmt(med.endDate)}
              </li>
            ))}
          </ul>
        ) : (
          <p>No previous medicine records found.</p>
        )}
      </section>
    </div>
  );
}
