import { useEffect, useRef, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";
import axios from "axios";

import { db } from "./firebase.js";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// speak detected object
function speak(text) {
  const synth = window.speechSynthesis;
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1;
  utter.pitch = 1;
  synth.speak(utter);
}

export default function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [model, setModel] = useState(null);
  const [lastLabel, setLastLabel] = useState("No object yet");
  const [aiReport, setAiReport] = useState("AI report will appear here...");
  const [loadingChatGPT, setLoadingChatGPT] = useState(false);
  const [userDescription, setUserDescription] = useState("");

  const [gps, setGps] = useState({ lat: null, lng: null });
  const [locationName, setLocationName] = useState(""); // NEW: place name

  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");

  const userName = localStorage.getItem("userName"); // show user info if registered

  // STEP 1: camera + ML model + GPS + location name
  useEffect(() => {
    async function setupCameraAndModel() {
      try {
        // camera setup
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // load TensorFlow model
        const loadedModel = await cocoSsd.load();
        setModel(loadedModel);

        // get GPS
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              const coords = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
              };
              setGps(coords);

              // get human-readable place name
              try {
                const res = await axios.get(
                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`
                );
                setLocationName(res.data.display_name || "Unknown location");
              } catch {
                setLocationName("Location not available");
              }
            },
            (err) => {
              console.warn("GPS error", err);
              setGps({ lat: null, lng: null });
              setLocationName("Location unavailable");
            }
          );
        }
      } catch (err) {
        console.error("Setup failed:", err);
      }
    }

    setupCameraAndModel();
  }, []);

  // STEP 2: live detection loop
  useEffect(() => {
    let rafId;

    const detectFrame = async () => {
      if (!model || !videoRef.current || !canvasRef.current) {
        rafId = requestAnimationFrame(detectFrame);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const predictions = await model.detect(video);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      predictions.forEach((p) => {
        const [x, y, w, h] = p.bbox;
        ctx.strokeStyle = "#FDB913";
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(x, y - 24, w, 24);
        ctx.fillStyle = "#FDB913";
        ctx.font = "16px sans-serif";
        ctx.fillText(`${p.class} (${(p.score * 100).toFixed(1)}%)`, x + 4, y - 6);
      });

      if (predictions.length > 0) {
        const label = predictions[0].class;
        if (label !== lastLabel) {
          setLastLabel(label);
          speak(`${label} detected`);
        }
      }

      rafId = requestAnimationFrame(detectFrame);
    };

    rafId = requestAnimationFrame(detectFrame);
    return () => cancelAnimationFrame(rafId);
  }, [model, lastLabel]);

  // STEP 3: generate AI report
  async function generateAIReport() {
    try {
      setLoadingChatGPT(true);
      const res = await fetch("/api/ai-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objectName: lastLabel }),
      });
      const data = await res.json();
      setAiReport(data.report || "No response from AI");
    } catch (err) {
      console.error(err);
      setAiReport("Error talking to AI backend");
    } finally {
      setLoadingChatGPT(false);
    }
  }

  // capture snapshot
  function captureSnapshotDataUrl() {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.toDataURL("image/jpeg", 0.8);
  }

  // STEP 4: submit report
  async function handleSubmitReport() {
    try {
      setSubmitting(true);
      setSubmitStatus("");

      const photoDataUrl = captureSnapshotDataUrl();

      const newReport = {
        reporterName: userName || "Guest User",
        detectedType: lastLabel || null,
        description: userDescription || "",
        aiSummary: aiReport || "",
        gpsLat: gps.lat,
        gpsLng: gps.lng,
        locationName: locationName,
        photo: photoDataUrl,
        status: "NEW",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "reports"), newReport);
      setUserDescription("");
      setSubmitStatus("Report submitted to municipality ✅");
    } catch (err) {
      console.error("Error saving report:", err);
      setSubmitStatus("Failed to submit report ❌");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background-100 text-textc-100">
      {/* Logged-in info */}
      {userName && (
        <div className="bg-primary-100 text-primary-700 text-center text-sm py-1 font-medium">
          Logged in as {userName}
        </div>
      )}

      {/* Header */}
      <header className="w-full bg-primary-500 text-white text-center py-3 font-semibold shadow-md">
        Polokwane Municipality – Intelligent Service Delivery Reporting System
      </header>

      {/* Content */}
      <main className="flex flex-col md:flex-row gap-6 p-4 md:p-8 flex-1">
        {/* LEFT CAMERA */}
        <div className="relative rounded-2xl overflow-hidden shadow-xl bg-white ring-2 ring-primary-500 flex-1">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-auto opacity-0 absolute"
          />
          <canvas ref={canvasRef} className="w-full h-auto block" />

          {/* detected label */}
          <div className="absolute top-4 left-4 bg-primary-600/90 px-4 py-2 rounded-xl shadow text-white text-sm font-medium">
            {lastLabel ? `Detected: ${lastLabel}` : "Detecting..."}
          </div>

          {/* location info */}
          <div className="absolute bottom-4 left-4 bg-white/90 text-textc-100 text-[11px] px-3 py-2 rounded-xl shadow max-w-[250px]">
            <div className="font-semibold text-[11px] text-primary-500">
              Location
            </div>
            <div>{locationName || "Fetching location..."}</div>
            <div>
              Lat: {gps.lat ? gps.lat.toFixed(5) : "…"} | Lng:{" "}
              {gps.lng ? gps.lng.toFixed(5) : "…"}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex flex-col gap-4 flex-1">
          {/* Title */}
          <section className="space-y-1">
            <h1 className="text-2xl font-bold text-textc-100">
              Intelligent Vision Reporter
            </h1>
            <p className="text-sm text-textc-100/80 leading-relaxed">
              Residents can report potholes, sewer blockages, garbage, leaks,
              or broken streetlights. The system captures evidence (photo + GPS),
              classifies the issue, and sends it to Polokwane Municipality for action.
            </p>
          </section>

          {/* AI Report */}
          <section className="bg-white rounded-2xl p-4 shadow ring-2 ring-primary-500/20 border border-primary-500/10 flex flex-col gap-3 min-h-[200px]">
            <div className="text-textc-100/60 text-xs uppercase tracking-wide">
              AI Report (draft for municipality)
            </div>
            <div className="text-textc-100 text-sm whitespace-pre-wrap">
              {aiReport}
            </div>
            <button
              onClick={generateAIReport}
              disabled={loadingChatGPT}
              className="self-start bg-primary-500 hover:bg-primary-600 active:scale-[.98] transition rounded-xl px-4 py-3 text-white font-semibold text-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingChatGPT
                ? "Generating report..."
                : "Generate municipal-style report with AI"}
            </button>
          </section>

          {/* Create Service Request */}
          <section className="bg-white rounded-2xl p-4 shadow ring-2 ring-primary-500/20 border border-primary-500/10 flex flex-col gap-3">
            <div className="text-textc-100/60 text-xs uppercase tracking-wide">
              Create Service Request
            </div>

            <label className="text-sm font-medium text-textc-100">
              Detected Issue Type
              <input
                className="mt-1 w-full border border-primary-500/30 rounded-lg p-2 text-sm bg-background-100 text-textc-100"
                value={lastLabel}
                readOnly
              />
            </label>

            <label className="text-sm font-medium text-textc-100">
              Your Description (what is wrong?)
              <textarea
                className="mt-1 w-full border border-primary-500/30 rounded-lg p-2 text-sm bg-background-100 text-textc-100"
                placeholder="Example: Large pothole near taxi rank, dangerous for cars and taxis. Needs urgent repair."
                rows={3}
                value={userDescription}
                onChange={(e) => setUserDescription(e.target.value)}
              />
            </label>

            <div className="text-[11px] text-textc-100/80 leading-relaxed">
              <div className="font-semibold text-primary-500 text-[11px]">
                Location (auto):
              </div>
              <div>{locationName || "Fetching location..."}</div>
            </div>

            <button
              onClick={handleSubmitReport}
              disabled={submitting}
              className="bg-accent-500 hover:opacity-90 active:scale-[.98] transition rounded-xl px-4 py-3 text-black font-semibold text-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? "Submitting..."
                : "Submit Report to Municipality"}
            </button>

            {submitStatus && (
              <div className="text-[11px] text-textc-100/80 leading-relaxed">
                {submitStatus}
              </div>
            )}

            <div className="text-[10px] text-textc-100/60 leading-relaxed">
              When you submit, the system stores your evidence (photo snapshot,
              AI summary, GPS, and timestamp) as a new case with status "NEW".
              City staff can mark it IN_PROGRESS or RESOLVED.
            </div>
          </section>

          {/* Footer */}
          <section className="text-[10px] text-textc-100/60 leading-relaxed">
            Pilot Municipality: Polokwane (Limpopo Province). Goal: faster
            response times and transparent tracking of service delivery issues
            like potholes, sewer blockages, garbage, water leaks, and broken
            streetlights.
          </section>
        </div>
      </main>
    </div>
  );
}
