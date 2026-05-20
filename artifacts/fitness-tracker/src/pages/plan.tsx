import { useGetWorkoutDays, useGetAppState } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dumbbell, Clock, Activity, Target } from "lucide-react";
import { motion } from "framer-motion";

export default function Plan() {
  const { data: days, isLoading: loadingDays } = useGetWorkoutDays();
  const { data: appState, isLoading: loadingState } = useGetAppState();

  if (loadingDays || loadingState) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Weekly Plan</h1>
        <div className="grid gap-6">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Weekly Training Plan</h1>
        <p className="text-muted-foreground mt-2">
          Cycle {appState?.currentCycleNumber} &mdash; Current focus is Day {appState?.currentWorkoutDayNumber}
        </p>
      </div>

      <div className="grid gap-6">
        {days?.map((day, idx) => {
          const isCurrent = appState?.currentWorkoutDayNumber === day.dayNumber;
          
          return (
            <motion.div
              key={day.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
            >
              <Card className={`overflow-hidden border-l-4 ${isCurrent ? 'border-l-primary bg-primary/5' : 'border-l-transparent bg-card/50'}`}>
                <CardHeader className="flex flex-row items-center justify-between bg-card/50 border-b border-card-border pb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-card border border-card-border font-bold text-lg text-primary">
                      D{day.dayNumber}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{day.focus}</CardTitle>
                      {isCurrent && <span className="text-xs font-semibold text-primary uppercase tracking-wider mt-1 block">Current Day</span>}
                    </div>
                  </div>
                  <Badge variant="outline" className="px-3 py-1 bg-card">
                    {day.exercises.length} Movements
                  </Badge>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-card-border/50">
                    {day.exercises.sort((a, b) => a.exerciseOrder - b.exerciseOrder).map((ed) => (
                      <div key={ed.id} className="p-4 md:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-card-border/20 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="mt-1 p-2 rounded-md bg-card border border-card-border text-muted-foreground">
                            {ed.exercise.category === 'Strength' ? <Dumbbell className="w-4 h-4" /> : 
                             ed.exercise.category === 'Cardio' ? <Activity className="w-4 h-4" /> :
                             <Target className="w-4 h-4" />}
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">{ed.exercise.name}</h4>
                            <p className="text-sm text-muted-foreground">{ed.exercise.category} &bull; {ed.exercise.trackingType}</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 text-sm md:justify-end">
                          {(ed.targetSets && ed.targetReps) && (
                            <Badge variant="secondary" className="flex gap-1 items-center bg-card">
                              <span className="font-medium text-foreground">{ed.targetSets}</span> sets × <span className="font-medium text-foreground">{ed.targetReps}</span> reps
                            </Badge>
                          )}
                          {ed.targetDurationSeconds && (
                            <Badge variant="secondary" className="flex gap-1 items-center bg-card">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="font-medium text-foreground">{Math.floor(ed.targetDurationSeconds / 60)}</span> min
                            </Badge>
                          )}
                          {ed.restBetweenSetsSec && (
                            <div className="text-muted-foreground text-xs bg-card px-2 py-1 rounded border border-card-border">
                              {ed.restBetweenSetsSec}s rest
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
