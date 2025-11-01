import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from './api';

const normalizePrescriptions = (raw = []) => {
  if (!Array.isArray(raw)) return [];
  return raw.map((prescription, index) => {
    const id = prescription._id || prescription.id || `prescription-${index}`;
    const createdAt = prescription.createdAt || prescription.date || prescription.updatedAt || null;
    const doctorName = typeof prescription.doctor === 'string'
      ? prescription.doctor
      : prescription.doctor?.name || prescription.doctorName || '';
    const medicines = Array.isArray(prescription.medicines)
      ? prescription.medicines.map((med, medIdx) => ({
          id: med._id || med.id || `${id}-med-${medIdx}`,
          name: med.name || med.medicine || '',
          dosage: med.dosage || '',
          frequency: med.frequency || '',
          duration: med.duration || '',
        }))
      : [];
    const fallbackMedicineName = prescription.medicine || prescription.medication || prescription.name;
    const normalizedMedicines = medicines.length > 0
      ? medicines
      : (fallbackMedicineName
        ? [{
            id: `${id}-fallback`,
            name: fallbackMedicineName,
            dosage: prescription.dosage || '',
            frequency: prescription.frequency || '',
            duration: prescription.duration || '',
          }]
        : []);

    return {
      id,
      createdAt,
      updatedAt: prescription.updatedAt || prescription.createdAt || null,
      doctorName,
      doctor: prescription.doctor,
      appointmentId: typeof prescription.appointment === 'object'
        ? prescription.appointment?._id || prescription.appointment?.id || null
        : prescription.appointment || null,
      notes: prescription.notes || '',
      nextVisit: prescription.nextVisit || '',
      medicines: normalizedMedicines,
    };
  });
};

const flattenMedicines = (prescription) => {
  if (!prescription || !Array.isArray(prescription.medicines)) return [];
  return prescription.medicines.map((med) => ({
    id: med.id || `${prescription.id}-${med.name || 'medicine'}`,
    name: med.name || '',
    dosage: med.dosage || '',
    frequency: med.frequency || '',
    duration: med.duration || '',
    notes: prescription.notes || '',
    prescriber: prescription.doctorName || '',
    createdAt: prescription.createdAt || null,
    nextVisit: prescription.nextVisit || '',
    prescriptionId: prescription.id,
  }));
};

// Thunk for attended patients (doctor's history)
export const fetchAttendedPatients = createAsyncThunk(
  'dashboard/fetchAttendedPatients',
  async () => {
    const response = await api.apiFetch('/api/doctor/attended-patients');
    return response.data?.data || [];
  }
);

// Thunk for digital records with prescriptions
export const fetchDigitalRecords = createAsyncThunk(
  'dashboard/fetchDigitalRecords',
  async () => {
    const response = await api.apiFetch('/api/prescriptions/records');
    return response.data?.records || [];
  }
);

// Thunk for the Doctor's queue
export const fetchDoctorQueue = createAsyncThunk(
  'dashboard/fetchDoctorQueue',
  async () => {
    const response = await api.apiFetch('/api/queue/doctor');
    return response.data;
  }
);

// Thunk for the Patient's data
export const fetchPatientData = createAsyncThunk(
  'dashboard/fetchPatientData',
  async () => {
    const [appointmentsRes, prescriptionsRes, doctorsRes] = await Promise.all([
      api.apiFetch('/api/appointments'),
      api.apiFetch('/api/prescriptions'),
      api.apiFetch('/api/users?role=doctor')
    ]);

    const rawPrescriptions = prescriptionsRes.data || [];
    const prescriptions = normalizePrescriptions(rawPrescriptions);
    const sorted = [...prescriptions].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    const [latestPrescription, ...olderPrescriptions] = sorted;
    const currentMedicines = flattenMedicines(latestPrescription);
    const previousMedicines = olderPrescriptions.flatMap(flattenMedicines);

    return {
      appointments: appointmentsRes.data || [],
      prescriptions,
      doctors: doctorsRes.data?.users || [],
      currentMedicines,
      previousMedicines,
      latestPrescriptionAt: latestPrescription?.createdAt || null,
    };
  }
);

const initialState = {
  queue: [],
  appointments: [],
  prescriptions: [],
  doctors: [],
  attendedPatients: [],
  digitalRecords: [],
  currentMedicines: [],
  previousMedicines: [],
  latestPrescriptionAt: null,
  loading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Doctor Queue Logic
      .addCase(fetchDoctorQueue.pending, (state) => { state.loading = true; })
      .addCase(fetchDoctorQueue.fulfilled, (state, action) => {
        state.queue = action.payload;
        state.loading = false;
      })
      .addCase(fetchDoctorQueue.rejected, (state) => { state.loading = false; })
      // Patient Data Logic
      .addCase(fetchPatientData.pending, (state) => { state.loading = true; })
      .addCase(fetchPatientData.fulfilled, (state, action) => {
        state.appointments = action.payload.appointments;
        state.prescriptions = action.payload.prescriptions;
        state.doctors = action.payload.doctors;
        state.currentMedicines = action.payload.currentMedicines;
        state.previousMedicines = action.payload.previousMedicines;
        state.latestPrescriptionAt = action.payload.latestPrescriptionAt;
        state.loading = false;
      })
      .addCase(fetchPatientData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || 'Failed to load patient data';
      })
      // Attended Patients Logic
      .addCase(fetchAttendedPatients.pending, (state) => { state.loading = true; })
      .addCase(fetchAttendedPatients.fulfilled, (state, action) => {
        state.attendedPatients = action.payload;
        state.loading = false;
      })
      .addCase(fetchAttendedPatients.rejected, (state) => { state.loading = false; })
      // Digital Records Logic
      .addCase(fetchDigitalRecords.pending, (state) => { state.loading = true; })
      .addCase(fetchDigitalRecords.fulfilled, (state, action) => {
        state.digitalRecords = action.payload;
        state.loading = false;
      })
      .addCase(fetchDigitalRecords.rejected, (state) => { state.loading = false; });
  },
});

export default dashboardSlice.reducer;
