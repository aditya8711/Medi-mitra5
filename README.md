# 🏥 Medi-mitra - Telemedicine Platform

> **A comprehensive telemedicine platform enabling seamless doctor-patient consultations with AI-powered features, real-time communication, and digital health record management.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green.svg)](https://www.mongodb.com/)

## 🌟 Features

### 🔐 **Authentication & Authorization**
- Secure user registration and login
- Role-based access control (Doctor/Patient)
- JWT-based session management
- Protected routes and API endpoints

### 👨‍⚕️ **Doctor Dashboard**
- **Patient Queue Management** - View and manage incoming patient appointments
- **Attended Patients** - Track completed consultations with detailed records
- **Digital Records** - Comprehensive patient history with secure unique IDs
- **Prescription Management** - Create, view, and download prescriptions
- **Real-time Statistics** - Monitor daily appointments and patient data

### 👤 **Patient Dashboard**  
- **Health Records** - Personal medical history and prescription tracking
- **Appointment Booking** - Schedule consultations with available doctors
- **Medicine Tracker** - Monitor current medications and dosages
- **Live Medicine Stock** - Check medicine availability in real-time

### 🎥 **Video Consultation System**
- **WebRTC Integration** - High-quality peer-to-peer video calls
- **Real-time Communication** - Instant messaging during consultations
- **Call Notifications** - Audio/visual alerts for incoming calls
- **Cross-platform Support** - Works on desktop and mobile browsers

### 🤖 **AI-Powered Features**
- **RAG System** - Retrieval-Augmented Generation for medical queries
- **Symptom Analysis** - AI-powered preliminary diagnosis assistance
- **Smart Recommendations** - Intelligent treatment suggestions
- **Medical Knowledge Base** - Extensive medical information retrieval

### 📊 **Data Management**
- **Secure Patient Records** - HIPAA-compliant data storage
- **Export Functionality** - Download medical records in various formats
- **Digital Prescriptions** - Generate and manage electronic prescriptions
- **Comprehensive Reporting** - Detailed medical history reports

### 🔄 **Real-time Features**
- **Socket.io Integration** - Live updates and notifications
- **Live Status Tracking** - Real-time appointment status updates
- **Instant Messaging** - Chat system during consultations
- **Notification System** - Push notifications for important events

## 🛠️ Technology Stack

### **Frontend**
- **React 18.3.1** - Modern UI framework with hooks and context
- **Redux Toolkit** - State management with RTK Query
- **React Router Dom** - Client-side routing and navigation
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Advanced animations and transitions
- **Three.js** - 3D graphics and interactive elements
- **Vite** - Fast development server and build tool

### **Backend**
- **Node.js & Express** - Server-side JavaScript runtime
- **MongoDB & Mongoose** - NoSQL database with ODM
- **Socket.io** - Real-time bidirectional communication
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing and security
- **Google Generative AI** - AI integration for medical assistance

### **Communication**
- **WebRTC** - Peer-to-peer video/audio communication
- **Simple-peer** - WebRTC wrapper for easier implementation
- **Socket.io** - Real-time messaging and notifications

### **Development Tools**
- **Nodemon** - Automatic server restart during development
- **CORS** - Cross-origin resource sharing configuration
- **dotenv** - Environment variable management
- **Body-parser** - Request body parsing middleware

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or higher
- MongoDB (local or cloud instance)
- Modern web browser with WebRTC support
- Git for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Rupendra0/Medi-mitra.git
   cd Medi-mitra
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Create .env file
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Configuration**
   
   Create `backend/.env`:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/medimitra
   JWT_SECRET=your_jwt_secret_key
   GEMINI_API_KEY=your_google_ai_api_key
   NODE_ENV=development
   ```

5. **Database Setup**
   ```bash
   # Make sure MongoDB is running
   # The application will create collections automatically
   ```

### Development

1. **Start Backend Server**
   ```bash
   cd backend
   npm start
   # Server runs on http://localhost:5000
   ```

2. **Start Frontend Development Server**
   ```bash
   cd frontend
   npm run dev
   # Frontend runs on http://localhost:5173
   ```

3. **Access the Application**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5000`

## 📖 API Documentation

### Authentication Endpoints
```
POST /api/auth/register    - User registration
POST /api/auth/login       - User login
POST /api/auth/logout      - User logout
GET  /api/auth/verify      - Token verification
```

### Patient Management
```
GET    /api/patients                     - Get all patients
GET    /api/patients/:id                 - Get patient by ID
POST   /api/patients                     - Create new patient
PUT    /api/patients/:id                 - Update patient
DELETE /api/patients/:id                 - Delete patient
GET    /api/patient/:id/complete-history - Get complete patient history
```

### Appointments
```
GET    /api/appointments           - Get all appointments
POST   /api/appointments           - Create new appointment
PUT    /api/appointments/:id       - Update appointment
DELETE /api/appointments/:id       - Delete appointment
GET    /api/doctor-queue          - Get doctor's patient queue
GET    /api/attended-patients     - Get attended patients
```

### Prescriptions
```
GET    /api/prescriptions         - Get all prescriptions
POST   /api/prescriptions         - Create new prescription
PUT    /api/prescriptions/:id     - Update prescription
DELETE /api/prescriptions/:id     - Delete prescription
```

### Real-time Events (Socket.io)
```
connect              - User connection
disconnect           - User disconnection
join-room           - Join video call room
leave-room          - Leave video call room
call-user           - Initiate video call
call-accepted       - Accept incoming call
call-rejected       - Reject incoming call
```

## 🏗️ Project Structure

```
Medi-mitra/
├── backend/                 # Backend API server
│   ├── controllers/         # Route controllers
│   │   ├── authController.js
│   │   ├── mainController.js
│   │   └── debugController.js
│   ├── middleware/          # Custom middleware
│   │   └── auth.js
│   ├── models/             # Database models
│   │   ├── User.js
│   │   ├── Appointment.js
│   │   ├── Prescription.js
│   │   └── ChatMessage.js
│   ├── routes/             # API routes
│   │   ├── auth.js
│   │   ├── main.js
│   │   ├── protected.js
│   │   └── ragRoutes.js
│   ├── services/           # Business logic
│   │   ├── socket.js
│   │   └── ragService.js
│   ├── config/             # Configuration
│   │   └── config.js
│   ├── utils/              # Utilities
│   │   └── vectorstore.json
│   └── index.js            # Entry point
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── CallNotification.jsx
│   │   │   └── patient-panels/
│   │   ├── pages/          # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── DoctorDashboard.jsx
│   │   │   ├── PatientDashboard.jsx
│   │   │   └── CallPage.jsx
│   │   ├── hooks/          # Custom hooks
│   │   │   ├── useWebRTC.js
│   │   │   └── usePatientWebRTC.js
│   │   ├── utils/          # Utilities
│   │   │   ├── api.js
│   │   │   ├── authSlice.js
│   │   │   ├── store.js
│   │   │   └── socket.js
│   │   ├── styles/         # CSS files
│   │   └── App.jsx         # Main app component
│   ├── public/             # Static assets
│   └── package.json
│
├── LICENSE                 # MIT License
└── README.md              # Project documentation
```

## 🔧 Configuration

### Database Schema

**Users Collection:**
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (enum: ['doctor', 'patient']),
  uniqueId: String,
  specialization: String, // for doctors
  age: Number,
  gender: String,
  phone: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Appointments Collection:**
```javascript
{
  patient: ObjectId (ref: 'User'),
  doctor: ObjectId (ref: 'User'),
  uniqueId: String,
  symptoms: [String],
  complaints: String,
  reason: String,
  status: String (enum: ['pending', 'completed', 'cancelled']),
  attendedAt: Date,
  prescription: ObjectId (ref: 'Prescription'),
  createdAt: Date,
  updatedAt: Date
}
```

**Prescriptions Collection:**
```javascript
{
  patient: ObjectId (ref: 'User'),
  doctor: ObjectId (ref: 'User'),
  appointment: ObjectId (ref: 'Appointment'),
  uniqueId: String,
  medicines: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String
  }],
  notes: String,
  nextVisit: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Authentication**: Secure token-based auth
- **CORS Protection**: Configured cross-origin policies
- **Data Sanitization**: Secure unique IDs (no MongoDB ObjectIDs exposed)
- **Input Validation**: Server-side request validation
- **Role-based Access**: Protected routes and API endpoints

## 🎯 Usage Examples

### Doctor Workflow
1. **Login** with doctor credentials
2. **View Patient Queue** to see pending appointments
3. **Start Video Call** with patient
4. **Conduct Consultation** using video/chat
5. **Create Prescription** with medicines and notes
6. **Mark Appointment Complete** and move to attended patients
7. **Export Records** for patient history

### Patient Workflow  
1. **Register/Login** with patient credentials
2. **Book Appointment** by selecting symptoms
3. **Wait for Doctor** in the queue
4. **Join Video Call** when doctor is ready
5. **Receive Prescription** after consultation
6. **Track Medicines** in the medicine tracker
7. **View Health Records** for medical history

### AI Assistant Usage
1. **Ask Medical Questions** in the chat interface
2. **Get Symptom Analysis** for preliminary diagnosis
3. **Receive Treatment Recommendations** based on symptoms
4. **Access Medical Knowledge** through RAG system

## 🚨 Troubleshooting

### Common Issues

**Frontend Build Errors:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**Backend Connection Issues:**
```bash
# Check MongoDB connection
mongosh # or mongo
show dbs

# Verify environment variables
cat backend/.env
```

**WebRTC Connection Problems:**
- Ensure HTTPS in production
- Check browser permissions for camera/microphone
- Verify STUN/TURN servers configuration
- Test with different browsers

**Socket.io Issues:**
- Check CORS configuration
- Verify server and client versions match
- Test connection with browser dev tools

### Development Tips

1. **Use Browser Dev Tools** for debugging WebRTC
2. **Monitor Network Tab** for API call failures  
3. **Check Console Logs** for Socket.io connection status
4. **Verify Database** connections and data structure
5. **Test with Multiple Browsers** for compatibility

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes** with proper documentation
4. **Add tests** if applicable
5. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
6. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Development Guidelines

- Follow **ES6+ syntax** and modern JavaScript practices
- Use **meaningful commit messages** with conventional commits
- Add **JSDoc comments** for functions and components
- Ensure **responsive design** for mobile compatibility
- Write **clean, readable code** with proper indentation
- Test **cross-browser compatibility** before submitting

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team** for the amazing frontend framework
- **MongoDB** for the flexible NoSQL database
- **Socket.io** for real-time communication capabilities
- **WebRTC** for peer-to-peer video calling
- **Google AI** for generative AI integration
- **Open Source Community** for various packages and libraries

## 📞 Support

For support and questions:

- **GitHub Issues**: [Create an issue](https://github.com/Rupendra0/Medi-mitra/issues)
- **Email**: [Contact the maintainer](mailto:rupendragangwar07@gmail.com)
- **Documentation**: Check this README and inline code comments

---

**Built with ❤️ for better healthcare accessibility**