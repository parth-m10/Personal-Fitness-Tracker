import { useGetWorkoutLogs, useDeleteWorkoutLog, getGetWorkoutLogsQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { format, parseISO } from "date-fns";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Filter, Trash2, Calendar, Flame, ChevronDown, ChevronRight, Activity } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function HistoryPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data: logs, isLoading } = useGetWorkoutLogs({ 
    status: statusFilter === "all" ? undefined : statusFilter 
  });
  
  const deleteLog = useDeleteWorkoutLog();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this workout log?")) return;
    
    deleteLog.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Workout log deleted" });
        queryClient.invalidateQueries({ queryKey: getGetWorkoutLogsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      }
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workout History</h1>
          <p className="text-muted-foreground mt-2">All past training sessions.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] bg-card">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="skipped">Skipped</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          [1,2,3,4].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
        ) : logs?.length === 0 ? (
          <Card className="bg-card/30 border-dashed">
            <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Calendar className="w-12 h-12 mb-4 opacity-20" />
              <p>No workout logs found.</p>
            </CardContent>
          </Card>
        ) : (
          logs?.map((log) => (
            <LogCard key={log.id} log={log} onDelete={() => handleDelete(log.id)} />
          ))
        )}
      </div>
    </div>
  );
}

function LogCard({ log, onDelete }: any) {
  const [isOpen, setIsOpen] = useState(false);
  
  let statusColor = "bg-card text-foreground";
  if (log.status === "completed") statusColor = "bg-green-500/10 text-green-500 border-green-500/20";
  if (log.status === "partial") statusColor = "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
  if (log.status === "skipped") statusColor = "bg-red-500/10 text-red-500 border-red-500/20";

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-card/50 backdrop-blur-sm border-card-border overflow-hidden">
        <CollapsibleTrigger asChild>
          <div className="p-4 md:px-6 flex items-center justify-between cursor-pointer hover:bg-card/80 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-card border border-card-border flex flex-col items-center justify-center shrink-0">
                <span className="text-xs font-bold text-muted-foreground">{format(parseISO(log.date), "MMM")}</span>
                <span className="text-lg font-bold leading-none text-primary">{format(parseISO(log.date), "dd")}</span>
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">Cycle {log.cycleNumber} &bull; Day {log.workoutDayNumber}</h3>
                  <Badge variant="outline" className={`ml-2 px-2 py-0 ${statusColor}`}>{log.status}</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  {log.energyLevel && (
                    <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> {log.energyLevel} Energy</span>
                  )}
                  {log.totalCalories && (
                    <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {log.totalCalories} kcal</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-muted-foreground hover:text-destructive hidden md:flex">
                <Trash2 className="w-4 h-4" />
              </Button>
              {isOpen ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="border-t border-card-border bg-black/20 p-4 md:px-6">
            <div className="text-sm text-muted-foreground mb-4">
              {log.notes ? `Notes: ${log.notes}` : "No notes recorded."}
            </div>
            <div className="flex justify-end mt-2 md:hidden">
               <Button variant="destructive" size="sm" onClick={onDelete}>Delete Log</Button>
            </div>
            {/* Would normally fetch and show exercise logs here by passing the ID to a subcomponent that uses useGetWorkoutLog */}
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => window.location.href=`/workout-detail/${log.id}`}>View Full Details</Button>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
