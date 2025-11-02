import { useEffect, useRef, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

import { db } from "./firebase.js";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// speak out loud what was detected
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

  // live detection result
  const [lastLabel, setLastLabel] = useState("No object yet");

  // AI summary from /api/ai-report
  const [aiReport, setAiReport] = useState("AI report will appear here...");
  const [loadingChatGPT, setLoadingChatGPT] = useState(false);

  // form state for resident
  const [userDescription, setUserDescription] = useState("");

  // GPS state
  const [gps, setGps] = useState({ lat: null, lng: null });

  // submission progress
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");

  // STEP 1: ask for camera + load ML model + get GPS when page loads
  useEffect(() => {
    async function setupCameraAndModel() {
      try {
        // 1. request camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }, // back camera for phone
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // 2. load object detection model
        const loadedModel = await cocoSsd.load();
        setModel(loadedModel);

        // 3. get GPS
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setGps({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
              });
            },
            (err) => {
              console.warn("GPS error", err);
              setGps({ lat: null, lng: null });
            }
          );
        }
      } catch (err) {
        console.error("Setup failed:", err);
      }
    }

    setupCameraAndModel();
  }, []);

  // STEP 2: run live detection in a loop
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

      // sync canvas size with video stream
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // detect objects
      const predictions = await model.detect(video);

      // draw current frame from camera
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // draw prediction boxes/labels
      predictions.forEach((p) => {
        const [x, y, w, h] = p.bbox;

        ctx.strokeStyle = "#FDB913"; // accent gold
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(x, y - 24, w, 24);

        ctx.fillStyle = "#FDB913";
        ctx.font = "16px sans-serif";
        ctx.fillText(
          `${p.class} (${(p.score * 100).toFixed(1)}%)`,
          x + 4,
          y - 6
        );
      });

      // choose the top (most confident) prediction
      if (predictions.length > 0) {
        const top = predictions[0];
        const label = top.class;
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

  // STEP 3: call AI endpoint to generate formal municipal report text
  async function generateAIReport() {
    try {
      setLoadingChatGPT(true);

      const res = await fetch("/api/ai-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objectName: lastLabel,
        }),
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

  // helper: take snapshot from canvas as Base64 image
  function captureSnapshotDataUrl() {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    // take the current canvas (which already has bounding boxes drawn)
    return canvas.toDataURL("image/jpeg", 0.8); // base64 string
  }

  // STEP 4: submit report to Firestore
  async function handleSubmitReport() {
    try {
      setSubmitting(true);
      setSubmitStatus("");

      const photoDataUrl = captureSnapshotDataUrl();

      // build the record we will save
      const newReport = {
        detectedType: lastLabel || null,
        description: userDescription || "",
        aiSummary: aiReport || "",
        gpsLat: gps.lat,
        gpsLng: gps.lng,
        photo: photoDataUrl, // base64 image
        status: "NEW", // municipality side will later update to IN_PROGRESS, RESOLVED
        createdAt: serverTimestamp(),
      };

      // save to Firestore "reports" collection
      await addDoc(collection(db, "reports"), newReport);

      // reset form
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
      {/* Municipal header */}
      <header className="w-full bg-primary-500 text-white text-center py-3 font-semibold shadow-md">
        Polokwane Municipality – Intelligent Service Delivery Reporting System
      </header>

      {/* Main content area */}
      <main className="flex flex-col md:flex-row gap-6 p-4 md:p-8 flex-1">
        {/* LEFT: camera and detection */}
        <div className="relative rounded-2xl overflow-hidden shadow-xl bg-white ring-2 ring-primary-500 flex-1">
          {/* invisible <video>, visible <canvas> */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-auto opacity-0 absolute"
          />
          <canvas ref={canvasRef} className="w-full h-auto block" />

          {/* floating label of detected object */}
          <div className="absolute top-4 left-4 bg-primary-600/90 px-4 py-2 rounded-xl shadow text-white text-sm font-medium">
            {lastLabel ? `Detected: ${lastLabel}` : "Detecting..."}
          </div>

          {/* floating GPS */}
          <div className="absolute bottom-4 left-4 bg-white/90 text-textc-100 text-[11px] leading-tight px-3 py-2 rounded-xl shadow">
            <div className="font-semibold text-[11px] text-primary-500">
              GPS
            </div>
            <div>
              Lat: {gps.lat ? gps.lat.toFixed(5) : "…"} <br />
              Lng: {gps.lng ? gps.lng.toFixed(5) : "…"}
            </div>
          </div>
        </div>

        {/* RIGHT: AI summary + form */}
        <div className="flex flex-col gap-4 flex-1">
          {/* intro */}
          <section className="space-y-1">
            <h1 className="text-2xl font-bold text-textc-100">
              Intelligent Vision Reporter
            </h1>
            <p className="text-sm text-textc-100/80 leading-relaxed">
              Residents can report potholes, sewer blockages, uncollected
              garbage, leaks, or broken streetlights. The system captures
              evidence (photo + GPS), classifies the issue, and sends it to
              Polokwane Municipality for action.
            </p>
          </section>

          {/* AI Report box */}
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

          {/* Create Service Request form */}
          <section className="bg-white rounded-2xl p-4 shadow ring-2 ring-primary-500/20 border border-primary-500/10 flex flex-col gap-3">
            <div className="text-textc-100/60 text-xs uppercase tracking-wide">
              Create Service Request
            </div>

            {/* Detected issue type */}
            <label className="text-sm font-medium text-textc-100">
              Detected Issue Type
              <input
                className="mt-1 w-full border border-primary-500/30 rounded-lg p-2 text-sm bg-background-100 text-textc-100"
                value={lastLabel}
                readOnly
              />
            </label>

            {/* User description */}
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

            {/* GPS display */}
            <div className="text-[11px] text-textc-100/80 leading-relaxed">
              <div className="font-semibold text-primary-500 text-[11px]">
                Location (auto):
              </div>
              <div>
                Lat: {gps.lat ? gps.lat.toFixed(5) : "…"} | Lng:{" "}
                {gps.lng ? gps.lng.toFixed(5) : "…"}
              </div>
            </div>

            {/* Submit button */}
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
              AI summary, GPS, timestamp) as a new case with status "NEW". City
              staff can mark it IN_PROGRESS or RESOLVED.
            </div>
          </section>

          {/* Footer note */}
          <section className="text-[10px] text-textc-100/60 leading-relaxed">
            Pilot Municipality: Polokwane (Limpopo Province). Goal: faster
            response times and transparent tracking of service delivery issues
            like potholes, sewer blockages, garbage, water leaks, and broken
            streetlights. :contentReference[oaicite:2]{index=2}
          </section>
        </div>
      </main>
    </div>
  );
}
