import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { Category } from '@/types'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/types'

interface CategoryDonutProps {
  data: Record<Category, number>
  height?: number
}

export function CategoryDonut({ data, height = 200 }: CategoryDonutProps) {
  const chartData = (Object.entries(data) as [Category, number][])
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      name: CATEGORY_LABELS[key],
      value,
      color: CATEGORY_COLORS[key],
    }))

  if (chartData.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-[#55556a] text-sm"
        style={{ height }}
      >
        No data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius="55%"
          outerRadius="80%"
          paddingAngle={2}
          dataKey="value"
          strokeWidth={0}
        >
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: '#141418',
            border: '1px solid #1e1e2a',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#e8e8f0',
          }}
          formatter={(value) => [`${value} min`, '']}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span style={{ color: '#888898', fontSize: '12px' }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
