




import express from 'express';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';
import {
  createAppointment,
  getAppointments,
  createPrescription,
  getPrescriptions,
  startCall,
  getDoctorQueue,
  getAppointmentById,
  completeAppointment,
  getAttendedPatients,
  getPatientCompleteHistory,
  debugPatientData
} from '../controllers/mainController.js';
import { listSockets, listUsers } from '../controllers/debugController.js';

const router = express.Router();

// --- Appointment Routes ---
router.route('/appointments')
  .post(authenticateJWT, createAppointment)
  .get(authenticateJWT, getAppointments);

router.post('/appointments/start-call', authenticateJWT, authorizeRoles('doctor'), startCall);
router.post('/appointments/complete', authenticateJWT, authorizeRoles('doctor'), completeAppointment);

// --- Prescription Routes ---
router.route('/prescriptions')
  .post(authenticateJWT, authorizeRoles('doctor'), createPrescription)
  .get(authenticateJWT, getPrescriptions);
  
// --- Queue Routes ---
router.get('/queue/doctor', authenticateJWT, authorizeRoles('doctor'), getDoctorQueue);

// --- Doctor attended patients ---
router.get('/doctor/attended-patients', authenticateJWT, authorizeRoles('doctor'), getAttendedPatients);

// --- Patient complete history (accepts uniqueId or MongoDB ObjectID for backward compatibility) ---
router.get('/patient/:patientId/complete-history', authenticateJWT, authorizeRoles('doctor'), getPatientCompleteHistory);

// --- Debug route ---
router.get('/debug/patient/:patientId', debugPatientData);

router.get('/appointments/:id', authenticateJWT, getAppointmentById);

// --- Debug Routes ---
router.get('/debug/sockets', listSockets);
router.get('/users', listUsers);

export default router;
