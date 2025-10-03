// IndexedDB utility for offline prescription storage
class OfflinePrescriptionDB {
  constructor() {
    this.dbName = 'MedimitraOfflineDB';
    this.version = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Prescriptions store
        if (!db.objectStoreNames.contains('prescriptions')) {
          const prescriptionStore = db.createObjectStore('prescriptions', {
            keyPath: 'id',
            autoIncrement: true
          });
          prescriptionStore.createIndex('patientId', 'patientId', { unique: false });
          prescriptionStore.createIndex('doctorId', 'doctorId', { unique: false });
          prescriptionStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Patient data store
        if (!db.objectStoreNames.contains('patients')) {
          const patientStore = db.createObjectStore('patients', {
            keyPath: 'id'
          });
        }

        // Offline downloads store (for generated TXT/PDF files)
        if (!db.objectStoreNames.contains('downloads')) {
          const downloadStore = db.createObjectStore('downloads', {
            keyPath: 'id',
            autoIncrement: true
          });
          downloadStore.createIndex('patientId', 'patientId', { unique: false });
          downloadStore.createIndex('type', 'type', { unique: false });
          downloadStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  async storePrescription(prescriptionData) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['prescriptions'], 'readwrite');
      const store = transaction.objectStore('prescriptions');

      const prescriptionToStore = {
        ...prescriptionData,
        cachedAt: Date.now(),
        offline: true
      };

      const request = store.put(prescriptionToStore);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getPrescriptionsByPatient(patientId) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['prescriptions'], 'readonly');
      const store = transaction.objectStore('prescriptions');
      const index = store.index('patientId');
      const request = index.getAll(patientId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllPrescriptions() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['prescriptions'], 'readonly');
      const store = transaction.objectStore('prescriptions');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async storePatientData(patientData) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['patients'], 'readwrite');
      const store = transaction.objectStore('patients');

      const patientToStore = {
        ...patientData,
        cachedAt: Date.now()
      };

      const request = store.put(patientToStore);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getPatientData(patientId) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['patients'], 'readonly');
      const store = transaction.objectStore('patients');
      const request = store.get(patientId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Store generated files (TXT/PDF) for offline access
  async storeDownload(downloadData) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['downloads'], 'readwrite');
      const store = transaction.objectStore('downloads');

      const downloadToStore = {
        ...downloadData,
        createdAt: Date.now(),
        offline: true
      };

      const request = store.add(downloadToStore);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getDownloadsByPatient(patientId) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['downloads'], 'readonly');
      const store = transaction.objectStore('downloads');
      const index = store.index('patientId');
      const request = index.getAll(patientId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Clear old cached data (optional cleanup)
  async clearOldData(daysOld = 30) {
    if (!this.db) await this.init();

    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    
    return Promise.all([
      this.clearOldPrescriptions(cutoffTime),
      this.clearOldDownloads(cutoffTime)
    ]);
  }

  async clearOldPrescriptions(cutoffTime) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['prescriptions'], 'readwrite');
      const store = transaction.objectStore('prescriptions');
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          if (cursor.value.cachedAt < cutoffTime) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearOldDownloads(cutoffTime) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['downloads'], 'readwrite');
      const store = transaction.objectStore('downloads');
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          if (cursor.value.createdAt < cutoffTime) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
}

// Export singleton instance
const offlineDB = new OfflinePrescriptionDB();
export default offlineDB;