import { useGetDashboardSummary, useGetWeeklyStats, useGetCycleComparison, useGetCompletionBreakdown, useGetVolumeByExercise } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, Activity, TrendingUp, Calendar as CalendarIcon, Timer, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: weeklyStats, isLoading: loadingWeekly } = useGetWeeklyStats();
  const { data: cycleStats, isLoading: loadingCycle } = useGetCycleComparison();
  const { data: breakdown, isLoading: loadingBreakdown } = useGetCompletionBreakdown();
  const { data: volume, isLoading: loadingVolume } = useGetVolumeByExercise();

  if (loadingSummary || !summary) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const COLORS = ['#22c55e', '#f59e0b', '#ef4444'];
  const pieData = breakdown ? [
    { name: 'Completed', value: breakdown.completed },
    { name: 'Partial', value: breakdown.partial },
    { name: 'Skipped', value: breakdown.skipped },
  ] : [];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">Cycle {summary.currentCycleNumber} &mdash; Day {summary.currentWorkoutDayNumber} ({summary.currentWorkoutFocus})</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Streak" value={summary.currentStreak} unit="days" icon={Flame} color="text-orange-500" delay={0.1} />
        <MetricCard title="Workouts" value={summary.totalWorkoutsCompleted} unit="done" icon={Target} color="text-green-500" delay={0.2} />
        <MetricCard title="Total Volume" value={summary.totalStrengthVolume} unit="kg" icon={Activity} color="text-blue-500" delay={0.3} />
        <MetricCard title="Cycling" value={summary.totalCyclingMinutes} unit="min" icon={Timer} color="text-purple-500" delay={0.4} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur-sm border-card-border">
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
            <CardDescription>Workout completion over recent weeks</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {loadingWeekly ? <Skeleton className="h-full w-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyStats || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="weekLabel" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e1e2d', borderColor: '#333', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Bar dataKey="completed" stackId="a" fill="#22c55e" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="partial" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="skipped" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-card-border">
          <CardHeader>
            <CardTitle>Completion Breakdown</CardTitle>
            <CardDescription>All-time exercise completion rate</CardDescription>
          </CardHeader>
          <CardContent className="h-80 flex justify-center items-center">
            {loadingBreakdown ? <Skeleton className="h-full w-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e1e2d', borderColor: '#333', borderRadius: '8px' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-card-border">
          <CardHeader>
            <CardTitle>Cycle Progression</CardTitle>
            <CardDescription>Volume comparison across cycles</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {loadingCycle ? <Skeleton className="h-full w-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cycleStats || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="cycleNumber" stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `C${val}`} />
                  <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e1e2d', borderColor: '#333', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="totalVolume" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, fill: '#0ea5e9' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur-sm border-card-border">
          <CardHeader>
            <CardTitle>Top Exercises</CardTitle>
            <CardDescription>Highest volume movements</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {loadingVolume ? <Skeleton className="h-full w-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volume?.slice(0, 5) || []} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                  <XAxis type="number" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="exerciseName" type="category" stroke="#888" fontSize={12} tickLine={false} axisLine={false} width={100} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e1e2d', borderColor: '#333', borderRadius: '8px' }} />
                  <Bar dataKey="totalVolume" fill="#00d4ff" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, unit, icon: Icon, color, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="bg-card/40 backdrop-blur-md border-card-border overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">{title}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">{value}</span>
                <span className="text-sm text-muted-foreground">{unit}</span>
              </div>
            </div>
            <div className={`p-3 rounded-xl bg-card border border-card-border ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
