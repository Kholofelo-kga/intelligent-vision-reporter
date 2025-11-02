import { useEffect, useRef, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

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
  const [lastLabel, setLastLabel] = useState("No object yet");
  const [aiReport, setAiReport] = useState("AI report will appear here...");
  const [loadingChatGPT, setLoadingChatGPT] = useState(false);

  const [userDescription, setUserDescription] = useState("");

  // STEP 1: ask camera + load ML model
  useEffect(() => {
    async function setupCameraAndModel() {
      try {
        // request camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }, // back camera on phones
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // load object detection model
        const loadedModel = await cocoSsd.load();
        setModel(loadedModel);
      } catch (err) {
        console.error("Camera/model setup failed:", err);
      }
    }

    setupCameraAndModel();
  }, []);

  // STEP 2: run detection in a loop
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

      // sync canvas size to video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // get predictions
      const predictions = await model.detect(video);

      // draw camera frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // draw boxes/labels
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

      // pick top prediction
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

  // STEP 3: call AI endpoint (/api/ai-report) to generate professional report text
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

  // STEP 4: (placeholder for now) submit report button
  // Later this will:
  // - capture GPS
  // - capture photo snapshot
  // - save to Firebase with status = "NEW"
  function handleSubmitReport() {
    alert(
      "Report submission will: save issue type, description, GPS, timestamp, photo to database for Polokwane Municipality. (We wire this in next step.)"
    );
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
        </div>

        {/* RIGHT: AI summary + form */}
        <div className="flex flex-col gap-4 flex-1">
          {/* intro */}
          <section className="space-y-1">
            <h1 className="text-2xl font-bold text-textc-100">
              Intelligent Vision Reporter
            </h1>
            <p className="text-sm text-textc-100/80 leading-relaxed">
              This tool helps residents report municipal issues (potholes,
              sewage leaks, uncollected waste, damaged streetlights). The camera
              uses AI to identify the issue, speaks it out loud, and can draft a
              professional incident report for municipal staff.
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

            {/* Submit button */}
            <button
              onClick={handleSubmitReport}
              className="bg-accent-500 hover:opacity-90 active:scale-[.98] transition rounded-xl px-4 py-3 text-black font-semibold text-sm shadow-lg"
            >
              Submit Report to Municipality
            </button>

            <div className="text-[10px] text-textc-100/60 leading-relaxed">
              When you submit, the system will attach GPS location, timestamp,
              and a snapshot photo as evidence. The municipality will see it on
              their dashboard and update the status.
            </div>
          </section>

          {/* Footer note */}
          <section className="text-[10px] text-textc-100/60 leading-relaxed">
            Pilot Municipality: Polokwane (Limpopo Province). This platform aims
            to improve response time for potholes, sewer blockages, uncollected
            garbage, water leaks, and broken streetlights.
          </section>
        </div>
      </main>
    </div>
  );
}
