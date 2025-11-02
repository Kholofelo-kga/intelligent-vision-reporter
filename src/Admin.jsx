import { useEffect, useState } from "react";
import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";

export default function Admin() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // fetch all reports from Firestore on load
  useEffect(() => {
    async function loadReports() {
      try {
        const q = query(
          collection(db, "reports"),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);

        const rows = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            detectedType: data.detectedType || "",
            description: data.description || "",
            aiSummary: data.aiSummary || "",
            gpsLat: data.gpsLat ?? null,
            gpsLng: data.gpsLng ?? null,
            status: data.status || "NEW",
            createdAt: data.createdAt
              ? data.createdAt.toDate().toLocaleString()
              : "—",
            photo: data.photo || null,
          };
        });

        setReports(rows);
      } catch (err) {
        console.error("Failed to load reports:", err);
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, []);

  return (
    <div className="min-h-screen bg-background-100 text-textc-100 p-4 md:p-8">
      {/* Header / banner */}
      <header className="w-full bg-primary-500 text-white rounded-xl px-4 py-4 mb-6 shadow-md flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-white/80">
            Polokwane Municipality
          </div>
          <div className="text-lg font-semibold">
            Service Delivery Incident Dashboard
          </div>
          <div className="text-[11px] text-white/70 leading-tight">
            Internal use: Track potholes, leaks, waste, sewer issues and
            response status.
          </div>
        </div>

        <div className="mt-4 md:mt-0 text-[11px] text-white/80">
          {loading
            ? "Loading reports..."
            : `Total Reports: ${reports.length}`}
        </div>
      </header>

      {/* Table */}
      <div className="bg-white rounded-xl shadow ring-2 ring-primary-500/20 border border-primary-500/10 overflow-x-auto">
        <table className="min-w-full text-left text-sm text-textc-100">
          <thead className="bg-primary-500/10 text-[11px] uppercase tracking-wide text-textc-100/70 border-b border-primary-500/20">
            <tr>
              <th className="px-3 py-2 whitespace-nowrap">Type</th>
              <th className="px-3 py-2 whitespace-nowrap">Description</th>
              <th className="px-3 py-2 whitespace-nowrap">AI Summary</th>
              <th className="px-3 py-2 whitespace-nowrap">GPS</th>
              <th className="px-3 py-2 whitespace-nowrap">Reported</th>
              <th className="px-3 py-2 whitespace-nowrap">Status</th>
              <th className="px-3 py-2 whitespace-nowrap">Photo</th>
            </tr>
          </thead>
          <tbody className="align-top divide-y divide-primary-500/10">
            {reports.length === 0 && !loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-6 text-center text-[13px] text-textc-100/60"
                >
                  No reports yet.
                </td>
              </tr>
            ) : (
              reports.map((rep) => (
                <tr key={rep.id} className="text-[12px]">
                  {/* Type */}
                  <td className="px-3 py-3 font-semibold text-primary-500">
                    {rep.detectedType || "—"}
                  </td>

                  {/* User description */}
                  <td className="px-3 py-3 max-w-[200px] whitespace-pre-wrap text-[12px]">
                    {rep.description || "—"}
                  </td>

                  {/* AI summary */}
                  <td className="px-3 py-3 max-w-[220px] whitespace-pre-wrap text-[12px] text-textc-100/80">
                    {rep.aiSummary || "—"}
                  </td>

                  {/* GPS */}
                  <td className="px-3 py-3 text-[11px] leading-tight text-textc-100/80">
                    {rep.gpsLat && rep.gpsLng
                      ? (
                          <>
                            Lat: {rep.gpsLat.toFixed(5)} <br />
                            Lng: {rep.gpsLng.toFixed(5)}
                          </>
                        )
                      : "—"}
                  </td>

                  {/* Time */}
                  <td className="px-3 py-3 text-[11px] leading-tight text-textc-100/80">
                    {rep.createdAt}
                  </td>

                  {/* Status */}
                  <td className="px-3 py-3">
                    <span
                      className={
                        "inline-block rounded-lg px-2 py-1 text-[10px] font-semibold " +
                        (rep.status === "RESOLVED"
                          ? "bg-green-200 text-green-800"
                          : rep.status === "IN_PROGRESS"
                          ? "bg-yellow-200 text-yellow-800"
                          : "bg-red-200 text-red-800")
                      }
                    >
                      {rep.status}
                    </span>
                  </td>

                  {/* Photo thumbnail */}
                  <td className="px-3 py-3">
                    {rep.photo ? (
                      <img
                        src={rep.photo}
                        alt="evidence"
                        className="w-20 h-20 object-cover rounded-lg border border-primary-500/30 shadow"
                      />
                    ) : (
                      <span className="text-[11px] text-textc-100/40">
                        —
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="text-[10px] text-textc-100/60 leading-relaxed mt-6">
        Internal dashboard – prototype build. Future work: assign case to
        department (Roads, Water, Waste), update status, generate service
        delivery SLA timeline and feedback notice to resident.
      </div>
    </div>
  );
}
