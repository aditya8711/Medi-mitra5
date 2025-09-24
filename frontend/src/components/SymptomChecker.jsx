import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import "../styles/page.css";
import { useLanguage } from '../utils/LanguageProvider';



export default function SymptomChecker() {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // localized symptoms array (stored in translations as an array)
  const localizedSymptoms = Array.isArray(t('symptomsList')) ? t('symptomsList') : [];

  const toggleSymptom = (symptom) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };

  const checkSymptoms = async () => {
    if (selectedSymptoms.length === 0) {
      setResult(t('pleaseSelectSymptom'));
      return;
    }

    setLoading(true);
    setResult("");

    try {
      const res = await fetch(`${API_URL}/api/gemini-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `${t('patientQueryPrefix') || 'Patient reports the following symptoms:'} ${selectedSymptoms.join(", ")}.`
        }),
      });

      const data = await res.json();
      setResult(data.reply || t('aiNoResponse'));
    } catch (err) {
      console.error("Error calling AI:", err);
      setResult(t('aiError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="symptom-checker">
  <h2>🧠 {t('symptomCheckerTitle')}</h2>
  <p>{t('selectSymptoms')}</p>

      <div className="symptom-grid">
        {(localizedSymptoms.length ? localizedSymptoms : ["Fever","Cough"]).map((symptom) => (
          <button
            key={symptom}
            onClick={() => toggleSymptom(symptom)}
            className={`symptom-button ${selectedSymptoms.includes(symptom) ? "selected" : ""
              }`}
          >
            {symptom}
          </button>
        ))}
      </div>

      <button className="check-button" onClick={checkSymptoms} disabled={loading}>
        {loading ? `⏳ ${t('checking')}` : `✅ ${t('checkSymptomsButton')}`}
      </button>

      {result && (
        <div className="result markdown-output">
          <ReactMarkdown>{result}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
