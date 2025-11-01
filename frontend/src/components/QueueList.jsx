import React from 'react';

export default function QueueList({
  items = [],
  onStart,
  onStartCall,
  onRecords,
  onMarkComplete,
  onDone,
  currentUser,
  allowStart = false
}) {
  if (!Array.isArray(items) || items.length === 0) {
    return <div className="simple-card muted">No items</div>;
  }

  return (
    <div className="simple-card compact-list">
      {items.map((p, i) => (
        <div key={p.appointmentId || p.patientId || i} className="queue-row">
          <div>
            <div style={{fontWeight:700}}>{p.name}</div>
            <div className="muted small">{p.symptoms || p.info || ''}</div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            {(() => {
              const isDoctor = !!(currentUser && typeof currentUser.role === 'string' && currentUser.role.toLowerCase() === 'doctor');
              const hasStartCb = Boolean(onStartCall || onStart);
              const showStart = hasStartCb && (allowStart || isDoctor);
              const handleStart = () => {
                if (onStartCall) {
                  onStartCall(p.patientId, p.appointmentId);
                } else if (onStart) {
                  onStart(p.patientId || p.appointmentId, p.appointmentId);
                }
              };
              return showStart ? <button className="btn" onClick={handleStart}>Start</button> : null;
            })()}
            {(() => {
              const hasRecords = Boolean(onGivePrescription || onRecords);
              if (!hasRecords) return null;

              const handleRecords = () => {
                if (onGivePrescription) {
                  onGivePrescription(p);
                } else if (onRecords) {
                  onRecords(p.patientId, p.appointmentId);
                }
              };

              return <button className="btn" onClick={handleRecords}>Records</button>;
            })()}
            {onMarkComplete ? (
              <button className="btn" onClick={() => onMarkComplete(p.appointmentId)}>Done</button>
            ) : onDone ? (
              <button className="btn" onClick={() => onDone(p.appointmentId)}>Done</button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
