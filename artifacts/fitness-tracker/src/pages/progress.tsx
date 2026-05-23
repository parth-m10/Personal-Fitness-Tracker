import { useFetchExerciseHistory, useGetExercises, getFetchExerciseHistoryQueryKey } from "@workspace/api-client-react";
import { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { Trophy, TrendingUp, ChevronDown } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Progress() {
  const [selectedExId, setSelectedExId] = useState<number | null>(null);
  const [days, setDays] = useState<number | null>(90);

  const { data: exercises, isLoading: loadingEx } = useGetExercises();
  
  // Set default exercise when loaded
  useMemo(() => {
    if (exercises && exercises.length > 0 && !selectedExId) {
      setSelectedExId(exercises[0].id);
    }
  }, [exercises, selectedExId]);

  const { data: history, isLoading: loadingHistory } = useFetchExerciseHistory(
    { exerciseId: selectedExId!, days },
    { query: { enabled: !!selectedExId, queryKey: getFetchExerciseHistoryQueryKey({ exerciseId: selectedExId!, days }) } }
  );

  const chartData = useMemo(() => {
    if (!history?.history) return [];
    return [...history.history].reverse().map(h => ({
      ...h,
      dateFormatted: format(parseISO(h.date), "MMM d")
    }));
  }, [history]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exercise Progress</h1>
          <p className="text-muted-foreground mt-2">Track performance trends for specific movements.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {loadingEx ? <Skeleton className="h-10 w-[200px]" /> : (
            <Select value={selectedExId?.toString()} onValueChange={v => setSelectedExId(Number(v))}>
              <SelectTrigger className="w-[240px] bg-card">
                <SelectValue placeholder="Select exercise" />
              </SelectTrigger>
              <SelectContent>
                {exercises?.map(e => (
                  <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <Select value={days?.toString() || "all"} onValueChange={v => setDays(v === "all" ? null : Number(v))}>
            <SelectTrigger className="w-[120px] bg-card">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
              <SelectItem value="180">Last 6 Months</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedExId || loadingHistory ? (
        <div className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
          </div>
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      ) : history && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-card/50 backdrop-blur-sm border-card-border border-t-4 border-t-primary">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Personal Best Weight</p>
                    <div className="text-3xl font-bold text-foreground mt-1">{history.personalBestWeight || 0} <span className="text-sm font-normal text-muted-foreground">kg</span></div>
                  </div>
                  <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    <Trophy className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 backdrop-blur-sm border-card-border border-t-4 border-t-blue-500">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Max Session Volume</p>
                    <div className="text-3xl font-bold text-foreground mt-1">{history.personalBestVolume || 0} <span className="text-sm font-normal text-muted-foreground">kg</span></div>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 backdrop-blur-sm border-card-border border-t-4 border-t-green-500">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Improvement</p>
                    <div className="text-3xl font-bold text-green-500 mt-1">+{history.improvementPercent?.toFixed(1) || 0}%</div>
                  </div>
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                    Since start
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card/50 backdrop-blur-sm border-card-border">
            <CardHeader>
              <CardTitle>Volume & Weight Trend</CardTitle>
              <CardDescription>How your performance changed over the selected timeframe</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="dateFormatted" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="left" stroke="#0ea5e9" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e1e2d', borderColor: '#333', borderRadius: '8px' }} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="actualWeightKg" name="Weight (kg)" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                    <Line yAxisId="right" type="monotone" dataKey="totalVolume" name="Total Volume" stroke="#8b5cf6" strokeWidth={2} dot={false} strokeDasharray="5 5" connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No data available for this timeframe.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
