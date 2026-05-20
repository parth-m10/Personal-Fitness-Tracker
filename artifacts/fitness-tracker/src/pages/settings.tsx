import { useGetUserTargets, useUpsertUserTarget, useGetAppState, useUpdateAppState, useGetExercises, getGetUserTargetsQueryKey, getGetAppStateQueryKey } from "@workspace/api-client-react";
import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Save, Settings2, SlidersHorizontal, RefreshCw } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function Settings() {
  const { data: targets, isLoading: loadingTargets } = useGetUserTargets();
  const { data: exercises, isLoading: loadingExercises } = useGetExercises();
  const { data: appState, isLoading: loadingState } = useGetAppState();
  
  const upsertTarget = useUpsertUserTarget();
  const updateState = useUpdateAppState();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [cycle, setCycle] = useState<number>(0);
  const [day, setDay] = useState<number>(0);

  const [targetForms, setTargetForms] = useState<Record<number, { sets: string, reps: string, weight: string, duration: string }>>({});

  // Initialize state form
  useMemo(() => {
    if (appState && cycle === 0) {
      setCycle(appState.currentCycleNumber);
      setDay(appState.currentWorkoutDayNumber);
    }
  }, [appState]);

  const handleStateUpdate = () => {
    updateState.mutate({
      data: { currentCycleNumber: cycle, currentWorkoutDayNumber: day }
    }, {
      onSuccess: () => {
        toast({ title: "App state updated" });
        queryClient.invalidateQueries({ queryKey: getGetAppStateQueryKey() });
      }
    });
  };

  const getTargetForm = (exerciseId: number) => {
    if (targetForms[exerciseId]) return targetForms[exerciseId];
    
    const existing = targets?.find(t => t.exerciseId === exerciseId);
    return {
      sets: existing?.targetSets?.toString() || "",
      reps: existing?.targetReps?.toString() || "",
      weight: existing?.targetWeightKg?.toString() || "",
      duration: existing?.targetDurationSeconds?.toString() || ""
    };
  };

  const handleTargetChange = (exerciseId: number, field: string, value: string) => {
    setTargetForms(prev => ({
      ...prev,
      [exerciseId]: { ...getTargetForm(exerciseId), [field]: value }
    }));
  };

  const saveTarget = (exerciseId: number) => {
    const form = targetForms[exerciseId];
    if (!form) return;

    upsertTarget.mutate({
      data: {
        exerciseId,
        targetSets: form.sets ? Number(form.sets) : null,
        targetReps: form.reps ? Number(form.reps) : null,
        targetWeightKg: form.weight ? Number(form.weight) : null,
        targetDurationSeconds: form.duration ? Number(form.duration) : null,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Target updated" });
        queryClient.invalidateQueries({ queryKey: getGetUserTargetsQueryKey() });
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings & Targets</h1>
        <p className="text-muted-foreground mt-2">Manage app state and specific exercise targets.</p>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-card-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings2 className="w-5 h-5 text-primary" /> Pointer Correction</CardTitle>
          <CardDescription>Manually adjust where you are in the program.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingState ? <Skeleton className="h-16 w-full" /> : (
            <div className="flex items-end gap-4 max-w-md">
              <div className="space-y-2 flex-1">
                <Label>Current Cycle</Label>
                <Input type="number" value={cycle || ""} onChange={e => setCycle(Number(e.target.value))} className="bg-card" />
              </div>
              <div className="space-y-2 flex-1">
                <Label>Current Day (1-5)</Label>
                <Input type="number" min={1} max={5} value={day || ""} onChange={e => setDay(Number(e.target.value))} className="bg-card" />
              </div>
              <Button onClick={handleStateUpdate} disabled={updateState.isPending}>
                <RefreshCw className="w-4 h-4 mr-2" /> Update
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur-sm border-card-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><SlidersHorizontal className="w-5 h-5 text-primary" /> Exercise Targets</CardTitle>
          <CardDescription>Override default targets for specific exercises.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingExercises || loadingTargets ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : (
            <div className="divide-y divide-card-border">
              {exercises?.map(ex => {
                const form = getTargetForm(ex.id);
                const hasCustom = targets?.some(t => t.exerciseId === ex.id);
                
                return (
                  <div key={ex.id} className="py-4 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    <div className="w-64">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground">{ex.name}</span>
                        {hasCustom && <Badge variant="default" className="text-[10px] px-1.5 py-0">Customized</Badge>}
                      </div>
                      <span className="text-xs text-muted-foreground">{ex.category} &bull; {ex.trackingType}</span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 flex-1">
                      <div className="w-20 space-y-1">
                        <Label className="text-xs">Sets</Label>
                        <Input size={1} className="h-8 text-sm bg-card" value={form.sets} onChange={e => handleTargetChange(ex.id, 'sets', e.target.value)} placeholder={ex.defaultSets?.toString() || "-"} />
                      </div>
                      <div className="w-20 space-y-1">
                        <Label className="text-xs">Reps</Label>
                        <Input size={1} className="h-8 text-sm bg-card" value={form.reps} onChange={e => handleTargetChange(ex.id, 'reps', e.target.value)} placeholder={ex.defaultReps?.toString() || "-"} />
                      </div>
                      <div className="w-24 space-y-1">
                        <Label className="text-xs">Weight (kg)</Label>
                        <Input size={1} className="h-8 text-sm bg-card" value={form.weight} onChange={e => handleTargetChange(ex.id, 'weight', e.target.value)} placeholder={ex.defaultWeightKg?.toString() || "-"} />
                      </div>
                      <div className="w-24 space-y-1">
                        <Label className="text-xs">Time (sec)</Label>
                        <Input size={1} className="h-8 text-sm bg-card" value={form.duration} onChange={e => handleTargetChange(ex.id, 'duration', e.target.value)} placeholder={ex.defaultDurationSeconds?.toString() || "-"} />
                      </div>
                      
                      <div className="pt-5 pl-2">
                        <Button variant="secondary" size="sm" onClick={() => saveTarget(ex.id)} className="h-8" disabled={upsertTarget.isPending}>
                          <Save className="w-3 h-3 mr-1" /> Save
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
