import React, { useState } from "react";

export default function MedicineUpdate({ previousMedicines, onUpdate }) {
  const [selectedMedicine, setSelectedMedicine] = useState("");
  const [updateNote, setUpdateNote] = useState("");

  const handleUpdate = () => {
    if (selectedMedicine && updateNote) {
      onUpdate(selectedMedicine, updateNote);
      setSelectedMedicine("");
      setUpdateNote("");
    }
  };

  return (
    <div className="simple-card">
      <h3>Update Previous Medicines</h3>
      <div>
        <label>Select Medicine:</label>
        <select
          value={selectedMedicine}
          onChange={e => setSelectedMedicine(e.target.value)}
        >
          <option value="">--Select--</option>
          {previousMedicines.map((med, idx) => (
            <option key={idx} value={med.name || med}>
              {med.name || med}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label>Update Note:</label>
        <input
          type="text"
          value={updateNote}
          onChange={e => setUpdateNote(e.target.value)}
          placeholder="Describe change or update"
        />
      </div>
      <button className="btn btn-primary" onClick={handleUpdate} disabled={!selectedMedicine || !updateNote}>
        Update Medicine
      </button>
    </div>
  );
}
