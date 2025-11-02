import { useEffect, useRef, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

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

  // Ask for camera + load ML model
  useEffect(() => {
    async function setupCameraAndModel() {
      // camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // back camera if on phone
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // AI model
      const loadedModel = await cocoSsd.load();
      setModel(loadedModel);
    }

    setupCameraAndModel();
  }, []);

  // Continuous detection loop
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

      // sync canvas size to video size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // run prediction
      const predictions = await model.detect(video);

      // draw camera frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // draw boxes + labels
      predictions.forEach((p) => {
        const [x, y, w, h] = p.bbox;

        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(x, y - 24, w, 24);

        ctx.fillStyle = "#facc15";
        ctx.font = "16px sans-serif";
        ctx.fillText(
          `${p.class} (${(p.score * 100).toFixed(1)}%)`,
          x + 4,
          y - 6
        );
      });

      // choose best guess
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

  // Call AI report (Vercel backend)
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

  return (
    <div className="flex flex-col md:flex-row gap-6 p-4 md:p-8 min-h-screen bg-slate-900 text-white">
      {/* LEFT: camera */}
      <div className="relative rounded-2xl overflow-hidden shadow-xl bg-slate-800 ring-2 ring-primary-500 flex-1">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-auto opacity-0 absolute"
        />
        <canvas ref={canvasRef} className="w-full h-auto block" />
        <div className="absolute top-4 left-4 bg-primary-600/80 px-4 py-2 rounded-xl shadow text-white text-sm font-medium">
          {lastLabel ? `Detected: ${lastLabel}` : "Detecting..."}
        </div>
      </div>

      {/* RIGHT: AI summary */}
      <div className="flex flex-col gap-4 flex-1">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold text-white">
            Intelligent Vision Reporter
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Live camera runs object detection in the browser, speaks what it
            sees, and can generate a municipal-style incident report using AI.
          </p>
        </header>

        <div className="bg-slate-800 rounded-2xl p-4 shadow ring-2 ring-slate-700 flex flex-col gap-3 min-h-[200px]">
          <div className="text-slate-400 text-xs uppercase tracking-wide">
            AI Report
          </div>
          <div className="text-slate-100 text-sm whitespace-pre-wrap">
            {aiReport}
          </div>
        </div>

        <button
          onClick={generateAIReport}
          disabled={loadingChatGPT}
          className="bg-primary-500 hover:bg-primary-600 active:scale-[.98] transition rounded-xl px-4 py-3 text-white font-semibold text-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingChatGPT
            ? "Generating report..."
            : "Generate municipal-style report with AI"}
        </button>

        <div className="text-[10px] text-slate-500 leading-relaxed">
          Example final output idea:
          <br />
          “On 02 Nov 2025 at 18:22 in Polokwane, a pothole was detected on the
          main road. This poses a safety risk to motorists and requires urgent
          municipal maintenance.”
        </div>
      </div>
    </div>
  );
}
