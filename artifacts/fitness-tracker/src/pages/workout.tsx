import { 
  useGetAppState, 
  useGetWorkoutDay, 
  useCreateWorkoutLog, 
  useGetPreviousSession,
  getGetAppStateQueryKey, 
  getGetDashboardSummaryQueryKey, 
  getGetWorkoutLogsQueryKey, 
  getGetCalendarDataQueryKey 
} from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Dumbbell, Save, CheckCircle, Info, Timer, Zap, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

type ExerciseFormState = {
  status: string;
  actualSets: string;
  actualReps: string;
  actualWeightKg: string;
  actualDurationSeconds: string;
  formQuality: string;
  painDiscomfort: boolean;
  notes: string;
};

export default function Workout() {
  const { data: appState, isLoading: loadingState } = useGetAppState();
  const currentDayNum = appState?.currentWorkoutDayNumber || 1;
  const { data: workoutDay, isLoading: loadingDay } = useGetWorkoutDay(currentDayNum, {
    query: { enabled: !!appState }
  });
  const { data: prevSession } = useGetPreviousSession(
    { dayNumber: currentDayNum },
    { query: { enabled: !!appState } }
  );

  const createLog = useCreateWorkoutLog();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [globalStatus, setGlobalStatus] = useState("completed");
  const [energyLevel, setEnergyLevel] = useState("Medium");
  const [globalNotes, setGlobalNotes] = useState("");
  const [totalCalories, setTotalCalories] = useState("");
  
  const [exerciseForms, setExerciseForms] = useState<Record<number, ExerciseFormState>>({});

  // Build a lookup map: exerciseId → previous session entry
  const prevMap = Object.fromEntries(
    (prevSession?.entries ?? []).map(e => [e.exerciseId, e])
  );

  // Init form defaults
  useEffect(() => {
    if (workoutDay && Object.keys(exerciseForms).length === 0) {
      const initial: Record<number, ExerciseFormState> = {};
      workoutDay.exercises.forEach(ed => {
        initial[ed.exerciseId] = {
          status: "completed",
          actualSets: ed.targetSets?.toString() || ed.exercise.defaultSets?.toString() || "",
          actualReps: ed.targetReps?.toString() || ed.exercise.defaultReps?.toString() || "",
          actualWeightKg: ed.targetWeightKg?.toString() || ed.exercise.defaultWeightKg?.toString() || "",
          actualDurationSeconds: ed.targetDurationSeconds?.toString() || ed.exercise.defaultDurationSeconds?.toString() || "",
          formQuality: "Good",
          painDiscomfort: false,
          notes: ""
        };
      });
      setExerciseForms(initial);
    }
  }, [workoutDay]);

  const handleExChange = (exId: number, field: keyof ExerciseFormState, value: any) => {
    setExerciseForms(prev => ({
      ...prev,
      [exId]: { ...prev[exId], [field]: value }
    }));
  };

  const handleFinish = () => {
    if (!appState || !workoutDay) return;

    const exerciseLogs = workoutDay.exercises.map(ed => {
      const f = exerciseForms[ed.exerciseId];
      return {
        exerciseId: ed.exerciseId,
        status: f.status,
        actualSets: f.actualSets ? Number(f.actualSets) : null,
        actualReps: f.actualReps ? Number(f.actualReps) : null,
        actualWeightKg: f.actualWeightKg ? Number(f.actualWeightKg) : null,
        actualDurationSeconds: f.actualDurationSeconds ? Number(f.actualDurationSeconds) : null,
        formQuality: f.formQuality,
        painDiscomfort: f.painDiscomfort,
        notes: f.notes || null,
        totalVolume: (f.actualSets && f.actualReps && f.actualWeightKg) ? 
          (Number(f.actualSets) * Number(f.actualReps) * Number(f.actualWeightKg)) : null
      };
    });

    createLog.mutate({
      data: {
        date: format(new Date(), "yyyy-MM-dd"),
        cycleNumber: appState.currentCycleNumber,
        workoutDayNumber: appState.currentWorkoutDayNumber,
        status: globalStatus,
        energyLevel: energyLevel,
        notes: globalNotes || null,
        totalCalories: totalCalories ? Number(totalCalories) : null,
        exerciseLogs
      }
    }, {
      onSuccess: () => {
        toast({ title: "Workout Saved!", description: "Cycle pointer advanced." });
        queryClient.invalidateQueries({ queryKey: getGetAppStateQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetWorkoutLogsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetCalendarDataQueryKey() });
        setLocation("/");
      },
      onError: (err) => {
        toast({ title: "Error saving workout", description: String(err), variant: "destructive" });
      }
    });
  };

  if (loadingState || loadingDay) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-24 w-full rounded-xl" />
        {[1,2,3].map(i => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
      </div>
    );
  }

  if (!workoutDay) return <div>No workout day found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="bg-card/40 border border-primary/20 p-6 rounded-2xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
        <div className="flex justify-between items-start">
          <div>
            <Badge className="mb-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">Today's Workout</Badge>
            <h1 className="text-3xl font-bold tracking-tight">Cycle {appState?.currentCycleNumber} &bull; Day {workoutDay.dayNumber}</h1>
            <p className="text-lg text-muted-foreground mt-1">{workoutDay.focus}</p>
          </div>
          <div className="text-right space-y-1">
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{format(new Date(), "MMMM d, yyyy")}</div>
            {prevSession?.date && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                <History className="w-3 h-3" />
                Last done {format(new Date(prevSession.date), "MMM d")}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {workoutDay.exercises.sort((a,b) => a.exerciseOrder - b.exerciseOrder).map((ed, idx) => {
          const ex = ed.exercise;
          const form = exerciseForms[ex.id];
          if (!form) return null;

          const isCardio = ex.category === 'Cardio' || ex.trackingType === 'timed';
          const prev = prevMap[ex.id];
          
          return (
            <motion.div
              key={ex.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className={`border-card-border overflow-hidden transition-all duration-300 ${form.status === 'skipped' ? 'opacity-50 grayscale bg-card/30' : 'bg-card/60'}`}>
                <CardHeader className="bg-black/5 dark:bg-black/20 pb-4 border-b border-card-border">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground bg-card px-2 py-0.5 rounded border border-card-border">{idx + 1}</span>
                        <CardTitle className="text-xl">{ex.name}</CardTitle>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs font-normal bg-card/80">{ex.category}</Badge>
                        <Badge variant="secondary" className="text-xs font-normal bg-card/80">{ex.trackingType}</Badge>
                      </div>
                    </div>
                    <Select value={form.status} onValueChange={(v) => handleExChange(ex.id, 'status', v)}>
                      <SelectTrigger className="w-[130px] h-8 bg-card border-card-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="skipped">Skipped</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                
                {form.status !== 'skipped' && (
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      
                      <div className="md:col-span-5 space-y-3">
                        <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 text-sm flex flex-col gap-2">
                          <div className="flex items-center gap-2 text-primary font-medium">
                            <Target className="w-4 h-4" /> Target
                          </div>
                          <div className="flex flex-wrap gap-4 text-foreground/80">
                            {ed.targetSets && <div><span className="font-semibold text-foreground">{ed.targetSets}</span> sets</div>}
                            {ed.targetReps && <div><span className="font-semibold text-foreground">{ed.targetReps}</span> reps</div>}
                            {ed.targetWeightKg && <div><span className="font-semibold text-foreground">{ed.targetWeightKg}</span> kg</div>}
                            {ed.targetDurationSeconds && <div><span className="font-semibold text-foreground">{ed.targetDurationSeconds}</span> sec</div>}
                          </div>
                        </div>

                        {prev && (
                          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 text-sm flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-amber-500 dark:text-amber-400 font-medium">
                              <History className="w-4 h-4" /> Last Session
                            </div>
                            <div className="flex flex-wrap gap-4 text-foreground/80">
                              {prev.actualSets != null && <div><span className="font-semibold text-foreground">{prev.actualSets}</span> sets</div>}
                              {prev.actualReps != null && <div><span className="font-semibold text-foreground">{prev.actualReps}</span> reps</div>}
                              {prev.actualWeightKg != null && <div><span className="font-semibold text-foreground">{prev.actualWeightKg}</span> kg</div>}
                              {prev.actualDurationSeconds != null && <div><span className="font-semibold text-foreground">{prev.actualDurationSeconds}</span> sec</div>}
                              {prev.formQuality && <div className="text-muted-foreground">{prev.formQuality} form</div>}
                            </div>
                          </div>
                        )}

                        {ex.formTip && (
                          <div className="flex gap-2 text-xs text-muted-foreground bg-card/50 p-2 rounded border border-card-border">
                            <Info className="w-4 h-4 shrink-0" />
                            <p>{ex.formTip}</p>
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {!isCardio && (
                          <>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground uppercase">Sets</Label>
                              <Input type="number" className="bg-card h-10 text-lg font-medium" value={form.actualSets} onChange={e => handleExChange(ex.id, 'actualSets', e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground uppercase">Reps</Label>
                              <Input type="number" className="bg-card h-10 text-lg font-medium" value={form.actualReps} onChange={e => handleExChange(ex.id, 'actualReps', e.target.value)} />
                            </div>
                            <div className="space-y-1.5 col-span-2 sm:col-span-2">
                              <Label className="text-xs text-muted-foreground uppercase">Weight (kg)</Label>
                              <Input type="number" className="bg-card h-10 text-lg font-medium" value={form.actualWeightKg} onChange={e => handleExChange(ex.id, 'actualWeightKg', e.target.value)} />
                            </div>
                          </>
                        )}
                        {isCardio && (
                           <div className="space-y-1.5 col-span-2 sm:col-span-4">
                              <Label className="text-xs text-muted-foreground uppercase">Duration (sec)</Label>
                              <Input type="number" className="bg-card h-10 text-lg font-medium" value={form.actualDurationSeconds} onChange={e => handleExChange(ex.id, 'actualDurationSeconds', e.target.value)} />
                           </div>
                        )}
                        
                        <div className="space-y-1.5 col-span-2">
                          <Label className="text-xs text-muted-foreground uppercase">Form Quality</Label>
                          <Select value={form.formQuality} onValueChange={(v) => handleExChange(ex.id, 'formQuality', v)}>
                            <SelectTrigger className="bg-card h-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Excellent">Excellent</SelectItem>
                              <SelectItem value="Good">Good</SelectItem>
                              <SelectItem value="Okay">Okay</SelectItem>
                              <SelectItem value="Poor">Poor</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="col-span-2 flex items-center gap-2 mt-6">
                           <Checkbox 
                            id={`pain-${ex.id}`} 
                            checked={form.painDiscomfort} 
                            onCheckedChange={(c) => handleExChange(ex.id, 'painDiscomfort', !!c)}
                           />
                           <Label htmlFor={`pain-${ex.id}`} className="text-sm font-normal text-destructive cursor-pointer">Felt pain/discomfort</Label>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-card-border mt-8">
        <CardHeader>
          <CardTitle>Session Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Session Status</Label>
              <Select value={globalStatus} onValueChange={setGlobalStatus}>
                <SelectTrigger className="bg-card h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Fully Completed</SelectItem>
                  <SelectItem value="partial">Partially Completed</SelectItem>
                  <SelectItem value="skipped">Skipped Day</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Energy Level</Label>
              <Select value={energyLevel} onValueChange={setEnergyLevel}>
                <SelectTrigger className="bg-card h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Total Calories (kcal)</Label>
              <Input type="number" className="bg-card h-10" value={totalCalories} onChange={e => setTotalCalories(e.target.value)} placeholder="e.g. 450" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Overall Session Notes</Label>
            <Textarea className="bg-card min-h-[100px]" placeholder="How did the session feel overall?" value={globalNotes} onChange={e => setGlobalNotes(e.target.value)} />
          </div>
        </CardContent>
        <CardFooter className="bg-black/5 dark:bg-black/20 border-t border-card-border p-6 flex justify-end">
          <Button size="lg" className="w-full sm:w-auto px-8 font-semibold text-lg h-12" onClick={handleFinish} disabled={createLog.isPending}>
            <CheckCircle className="w-5 h-5 mr-2" />
            Finish & Save Workout
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

const Target = ({className}:any) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
