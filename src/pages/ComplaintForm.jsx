import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import API from "../services/api";

const ComplaintForm = () => {
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: null,
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);

      if (imagePreview) URL.revokeObjectURL(imagePreview);

      setImagePreview(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
          }));
        },
        (err) => {
          console.error("GPS Error:", err);
          alert("Location is mandatory for reporting. Please enable GPS.");
        },
        { enableHighAccuracy: true },
      );
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!image) return alert("Please upload a photo of the issue.");
    if (!formData.location) return alert("Waiting for GPS location...");

    setIsSubmitting(true);

    const data = new FormData();
    data.append("title", formData.title.trim());
    data.append("description", formData.description.trim());
    data.append("image", image);
    data.append("latitude", formData.location.lat);
    data.append("longitude", formData.location.lng);

    try {
      // ✅ Updated endpoint according to backend API
      await API.post("grievances/citizen/", data);

      setIsSuccess(true);
      setTimeout(() => navigate("/user-dashboard"), 2000);
    } catch (error) {
      console.error("Backend Error:", error.response?.data);

      const errorData = error.response?.data;
      let errorMsg = "Submission failed.";

      if (errorData) {
        errorMsg =
          typeof errorData === "object"
            ? Object.entries(errorData)
                .map(([k, v]) => `${k}: ${v}`)
                .join("\n")
            : errorData;
      }

      alert(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------- VOICE FEATURE ----------------
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const startListening = () => {
    resetTranscript();

    SpeechRecognition.startListening({
      continuous: false,
      language: "en-IN",
    });
  };

  const handleVoiceFill = () => {
    if (!transcript) return alert("No voice detected.");

    setFormData((prev) => ({
      ...prev,
      description: transcript,
      title: transcript.split(" ").slice(0, 5).join(" "),
    }));

    SpeechRecognition.stopListening();
    resetTranscript();
  };

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="p-10 text-center">
        Your browser does not support speech recognition.
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center p-10 min-h-[60vh] text-center bg-white rounded-3xl shadow-sm mx-4 mt-10 border border-green-100">
        <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center text-4xl mb-6 shadow-lg">
          ✓
        </div>
        <h2 className="text-2xl font-bold text-[#0F2A44]">Report Received</h2>
        <p className="text-slate-500 mt-2">Thank you for your contribution.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 font-sans">
      <form
        onSubmit={handleSubmit}
        className="max-w-md mx-auto bg-white shadow-2xl rounded-[2.5rem] border border-slate-100 overflow-hidden"
      >
        <div className="bg-[#0F2A44] p-8 text-white relative">
          <h2 className="text-2xl font-bold tracking-tight">New Report</h2>
          <p className="text-blue-200 text-sm mt-1 opacity-90">
            Fill in the details below
          </p>

          <div
            className={`absolute top-8 right-6 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${
              formData.location
                ? "bg-green-500/20 border-green-400 text-green-400"
                : "bg-orange-500/20 border-orange-400 text-orange-400 animate-pulse"
            }`}
          >
            {formData.location ? "● Location Locked" : "○ Finding GPS..."}
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="group">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
              Issue Title
            </label>
            <input
              type="text"
              placeholder="What is the problem?"
              required
              value={formData.title}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          <div className="group relative">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
              Description
            </label>

            <div className="relative">
              <textarea
                placeholder="Describe what you see..."
                required
                value={formData.description}
                className="w-full p-4 pb-12 bg-slate-50 border border-slate-200 rounded-2xl h-40 outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400 resize-none"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: e.target.value,
                  })
                }
              />

              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                {transcript && !listening && (
                  <button
                    type="button"
                    onClick={handleVoiceFill}
                    className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-lg font-bold uppercase animate-bounce"
                  >
                    Click to Apply Text
                  </button>
                )}

                <button
                  type="button"
                  onClick={
                    listening ? SpeechRecognition.stopListening : startListening
                  }
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 ${
                    listening
                      ? "bg-red-500 animate-pulse ring-4 ring-red-100"
                      : "bg-[#25D366] hover:bg-[#128C7E] shadow-green-200"
                  }`}
                >
                  {listening ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="6" y="4" width="4" height="16"></rect>
                      <rect x="14" y="4" width="4" height="16"></rect>
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                      <line x1="12" y1="19" x2="12" y2="23"></line>
                      <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {listening && (
              <p className="text-[10px] text-red-500 font-bold mt-2 ml-2 uppercase tracking-tighter">
                ● Recording Voice...
              </p>
            )}
          </div>

          <div className="group">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
              Evidence Photo
            </label>
            <div className="relative border-2 border-dashed border-slate-300 rounded-[2rem] bg-slate-50 hover:bg-slate-100 transition-all overflow-hidden group/box min-h-[160px] flex items-center justify-center">
              <input
                type="file"
                accept="image/*"
                required
                className="absolute inset-0 opacity-0 cursor-pointer z-20"
                onChange={handleImageChange}
              />

              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-full w-full object-cover z-10"
                />
              ) : (
                <div className="text-center p-6">
                  <div className="text-3xl mb-2 opacity-40">📷</div>
                  <p className="text-xs font-semibold text-slate-400">
                    Tap to Capture / Upload
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !formData.location}
            className={`w-full py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest text-white shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 ${
              isSubmitting || !formData.location
                ? "bg-slate-200 text-slate-400 shadow-none cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/20"
            }`}
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-[3px] border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Send Report"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ComplaintForm;
