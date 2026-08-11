import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function ProgressChart({ weeks }) {
  if (!weeks || weeks.length < 2) {
    return <p className="muted">Log at least two weeks of this exercise to see a chart.</p>;
  }

  const data = weeks.map((w) => ({ week: w.week.replace(/^\d{4}-/, ""), e1RM: w.best_e1rm }));

  return (
    <div className="progress-chart">
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} />
          <YAxis stroke="#94a3b8" fontSize={11} />
          <Tooltip
            contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
            labelStyle={{ color: "#f1f5f9" }}
          />
          <Line type="monotone" dataKey="e1RM" stroke="#14b8a6" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
