import express from 'express';
import Prescription from '../models/Prescription.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';

const router = express.Router();

// Create a new prescription
router.post('/prescriptions/create', async (req, res) => {
  try {
    const {
      appointmentId,
      patientId,
      doctorId,
      medicines,
      notes,
      nextVisit
    } = req.body;

    // Validate required fields
    if (!appointmentId || !patientId || !doctorId) {
      return res.status(400).json({ 
        message: 'Missing required fields: appointmentId, patientId, doctorId' 
      });
    }

    // Check if appointment exists
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if prescription already exists for this appointment
    const existingPrescription = await Prescription.findOne({ appointment: appointmentId });
    if (existingPrescription) {
      // Update existing prescription
      existingPrescription.medicines = medicines || [];
      existingPrescription.notes = notes || '';
      existingPrescription.nextVisit = nextVisit || 'No follow-up needed';
      existingPrescription.updatedAt = new Date();

      const updatedPrescription = await existingPrescription.save();
      
      return res.status(200).json({
        message: 'Prescription updated successfully',
        prescription: updatedPrescription
      });
    }

    // Create new prescription
    const newPrescription = new Prescription({
      appointment: appointmentId,
      patient: patientId,
      doctor: doctorId,
      medicines: medicines || [],
      notes: notes || '',
      nextVisit: nextVisit || 'No follow-up needed'
    });

    const savedPrescription = await newPrescription.save();

    // Update appointment with prescription reference
    await Appointment.findByIdAndUpdate(appointmentId, { 
      prescription: savedPrescription._id,
      status: 'completed',
      attendedAt: new Date()
    });

    res.status(201).json({
      message: 'Prescription created successfully',
      prescription: savedPrescription
    });

  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(500).json({ 
      message: 'Failed to create prescription', 
      error: error.message 
    });
  }
});

// Get prescriptions for a specific patient
router.get('/prescriptions/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const prescriptions = await Prescription.find({ patient: patientId })
      .populate('doctor', 'name specialization')
      .populate('appointment', 'date symptoms complaints reason')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Patient prescriptions fetched successfully',
      prescriptions
    });

  } catch (error) {
    console.error('Error fetching patient prescriptions:', error);
    res.status(500).json({ 
      message: 'Failed to fetch patient prescriptions', 
      error: error.message 
    });
  }
});

// Get prescriptions for a specific doctor
router.get('/prescriptions/doctor/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    const prescriptions = await Prescription.find({ doctor: doctorId })
      .populate('patient', 'name email phone')
      .populate('appointment', 'date symptoms complaints reason')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Doctor prescriptions fetched successfully',
      prescriptions
    });

  } catch (error) {
    console.error('Error fetching doctor prescriptions:', error);
    res.status(500).json({ 
      message: 'Failed to fetch doctor prescriptions', 
      error: error.message 
    });
  }
});

// Get prescription by appointment ID
router.get('/prescriptions/appointment/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    const prescription = await Prescription.findOne({ appointment: appointmentId })
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization')
      .populate('appointment', 'date symptoms complaints reason');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found for this appointment' });
    }

    res.status(200).json({
      message: 'Prescription fetched successfully',
      prescription
    });

  } catch (error) {
    console.error('Error fetching prescription by appointment:', error);
    res.status(500).json({ 
      message: 'Failed to fetch prescription', 
      error: error.message 
    });
  }
});

// Get all prescriptions with detailed patient and doctor info for digital records
router.get('/prescriptions/records', async (req, res) => {
  try {
    const prescriptions = await Prescription.find()
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization')
      .populate('appointment', 'date symptoms complaints reason status')
      .sort({ createdAt: -1 });

    // Transform data for digital records format
    const recordsData = prescriptions.map(prescription => ({
      _id: prescription._id,
      patient: {
        _id: prescription.patient._id,
        name: prescription.patient.name,
        email: prescription.patient.email,
        phone: prescription.patient.phone
      },
      doctor: prescription.doctor.name,
      date: prescription.createdAt,
      visitDate: prescription.appointment.date,
      complaints: prescription.appointment.complaints || prescription.appointment.symptoms?.join(', ') || '',
      symptoms: prescription.appointment.symptoms || [],
      prescriptions: prescription.medicines.map(med => ({
        medicine: med.name,
        medication: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        notes: prescription.notes
      })),
      notes: prescription.notes,
      nextVisit: prescription.nextVisit,
      status: prescription.appointment.status,
      attendedAt: prescription.appointment.attendedAt || prescription.createdAt
    }));

    res.status(200).json({
      message: 'Digital records fetched successfully',
      records: recordsData
    });

  } catch (error) {
    console.error('Error fetching digital records:', error);
    res.status(500).json({ 
      message: 'Failed to fetch digital records', 
      error: error.message 
    });
  }
});

// Update prescription
router.put('/prescriptions/:prescriptionId', async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    const { medicines, notes, nextVisit } = req.body;

    const updatedPrescription = await Prescription.findByIdAndUpdate(
      prescriptionId,
      {
        medicines: medicines || [],
        notes: notes || '',
        nextVisit: nextVisit || 'No follow-up needed',
        updatedAt: new Date()
      },
      { new: true }
    ).populate('patient', 'name').populate('doctor', 'name');

    if (!updatedPrescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    res.status(200).json({
      message: 'Prescription updated successfully',
      prescription: updatedPrescription
    });

  } catch (error) {
    console.error('Error updating prescription:', error);
    res.status(500).json({ 
      message: 'Failed to update prescription', 
      error: error.message 
    });
  }
});

// Delete prescription
router.delete('/prescriptions/:prescriptionId', async (req, res) => {
  try {
    const { prescriptionId } = req.params;

    const deletedPrescription = await Prescription.findByIdAndDelete(prescriptionId);
    
    if (!deletedPrescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Remove prescription reference from appointment
    await Appointment.findByIdAndUpdate(deletedPrescription.appointment, { 
      $unset: { prescription: 1 } 
    });

    res.status(200).json({
      message: 'Prescription deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting prescription:', error);
    res.status(500).json({ 
      message: 'Failed to delete prescription', 
      error: error.message 
    });
  }
});

export default router;