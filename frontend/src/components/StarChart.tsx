import React from 'react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip,
} from 'recharts';

interface StarChartProps {
    data: {
        subject: string;
        A: number; // Score
        fullMark: number;
    }[];
    color?: string;
}

const StarChart: React.FC<StarChartProps> = ({ data, color = '#8884d8' }) => {
    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    <PolarGrid />
                    {/* @ts-ignore */}
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 12 } as any} />
                    <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                    <Radar
                        name="Score"
                        dataKey="A"
                        stroke={color}
                        fill={color}
                        fillOpacity={0.6}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                        itemStyle={{ color: color }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default StarChart;
