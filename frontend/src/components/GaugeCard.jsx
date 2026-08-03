import React from "react";
import { 
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis
} from "recharts";

const GaugeCard = ({
  gauge = {},
  colorInfo = {},
  timeFrameLabel = "",
  highlightNegative = false,
}) => {
  const colors = colorInfo || {};
  
  const { name = "Metric", value = 0, max = 100 } = gauge;
  const isNegative = value < 0;
  const absValue = Math.abs(value);
  
  const chartValue = isNegative ? absValue : value;
  const percentage = max > 0 ? Math.min((absValue / max) * 100, 100) : 0;

  // Sanitize name for the SVG gradient ID (removes spaces and special characters)
  const safeGradientId = `gradient-${String(name).replace(/[^a-zA-Z0-9_-]/g, "")}`;

  // Determine colors based on whether value is negative
  const gradientStart = isNegative ? '#ef4444' : (colors.gradientStart || '#00C49F');
  const gradientEnd = isNegative ? '#dc2626' : (colors.gradientEnd || '#0088FE');
  const textColor = isNegative ? 'text-red-600' : (colors.text || 'text-gray-800');
  const percentColor = isNegative ? 'text-red-500' : 'text-gray-500';

  return (
    <div className="bg-white rounded-xl p-5 -mx-3 lg:-mx-0 md:-mx-5 shadow-sm flex flex-col items-center border border-gray-100 min-w-0">
      <h3 className={`text-lg font-semibold mb-4 ${textColor}`}>
        {name}
      </h3>
      
      {/* Set explicit sizing and overflow handling for the chart wrapper */}
      <div className="w-full h-48 relative min-w-0">
        <svg className="w-0 h-0 absolute">
          <defs>
            <linearGradient id={safeGradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={gradientStart} />
              <stop offset="100%" stopColor={gradientEnd} />
            </linearGradient>
          </defs>
        </svg>

        {/* Added minWidth={0} and explicit fallback height */}
        <ResponsiveContainer width="100%" height={192} minWidth={0}>
          <RadialBarChart
            data={[{ ...gauge, value: chartValue }]}
            cx="50%"
            cy="50%"
            startAngle={180}
            endAngle={0}
            innerRadius="75%"
            outerRadius="105%"
          >
            <PolarAngleAxis
              type="number"
              domain={[0, max]}
              angleAxisId={0}
              tick={false}
            />

            <RadialBar
              minAngle={15}
              background={{ fill: '#f3f4f6' }}
              dataKey="value"
              cornerRadius="50%"
              fill={`url(#${safeGradientId})`}
            />
          </RadialBarChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center pt-8 pointer-events-none">
          <span className={`text-2xl font-bold ${textColor}`}>
            {`${isNegative ? '-' : ''}$${Math.round(absValue).toLocaleString()}`}
          </span>
          <span className={`text-sm font-medium ${percentColor}`}>
            {Math.round(percentage)}%
          </span>
        </div>
      </div>

      <div className="text-center mt-3">
        {isNegative && highlightNegative && (
          <p className="text-sm text-red-600 font-semibold mb-1">
            Negative savings
          </p>
        )}
        <p className="text-sm text-gray-500">
          {timeFrameLabel} data
        </p>
      </div>
    </div>
  );
};

export default GaugeCard;