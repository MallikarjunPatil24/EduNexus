import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const GradeChart = ({ data = [], type = 'line' }) => {
  // Convert letter grades to numeric points for charting if needed
  const gradePoints = {
    'A+': 95,
    'A': 85,
    'B': 75,
    'C': 65,
    'D': 55,
    'E': 40,
    'F': 25,
  };

  const chartData = data.map((item) => ({
    name: item.examName || item.subject,
    score: item.marksObtained || gradePoints[item.grade] || item.score || 0,
    grade: item.grade || 'N/A',
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-navy p-3 border border-gold/30 rounded-lg shadow-lg text-cream text-xs">
          <p className="font-bold">{dataPoint.name}</p>
          <p className="mt-1">Score: <span className="font-semibold text-gold">{dataPoint.score}%</span></p>
          <p>Grade: <span className="font-semibold text-gold">{dataPoint.grade}</span></p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center border border-gold/20 rounded-xl bg-white text-navy/40 text-sm">
        No evaluation data available to chart.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gold/20 p-5 shadow-sm h-72">
      <ResponsiveContainer width="100%" height="100%">
        {type === 'bar' ? (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
            <XAxis dataKey="name" stroke="#1B2A4A" fontSize={11} tickLine={false} />
            <YAxis domain={[0, 100]} stroke="#1B2A4A" fontSize={11} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="score" fill="#D4A853" radius={[4, 4, 0, 0]} barSize={35} />
          </BarChart>
        ) : (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
            <XAxis dataKey="name" stroke="#1B2A4A" fontSize={11} tickLine={false} />
            <YAxis domain={[0, 100]} stroke="#1B2A4A" fontSize={11} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#1B2A4A"
              strokeWidth={3}
              activeDot={{ r: 6 }}
              dot={{ stroke: '#D4A853', strokeWidth: 2, fill: '#1B2A4A', r: 4 }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default GradeChart;
