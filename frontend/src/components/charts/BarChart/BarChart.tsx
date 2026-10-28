import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface BarChartProps {
  data: any[];
  dataKeys: {
    key: string;
    name: string;
    color: string;
  }[];
  xAxisKey: string;
  height?: number;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  dataKeys,
  xAxisKey,
  height = 300,
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xAxisKey} />
        <YAxis />
        <Tooltip />
        <Legend />
        {dataKeys.map((dataKey) => (
          <Bar
            key={dataKey.key}
            dataKey={dataKey.key}
            name={dataKey.name}
            fill={dataKey.color}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};
