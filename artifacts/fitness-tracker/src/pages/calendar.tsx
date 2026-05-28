import { useGetCalendarData, getGetCalendarDataQueryKey } from "@workspace/api-client-react";
import type { CalendarDay } from "@workspace/api-client-react";
import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Dumbbell, Flame, Bike, StickyNote, CheckCircle, XCircle, MinusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function statusIcon(s: string) {
  if (s === "completed") return <CheckCircle className="w-3 h-3" />;
  if (s === "partial") return <MinusCircle className="w-3 h-3" />;
  if (s === "missed") return <XCircle className="w-3 h-3" />;
  return <XCircle className="w-3 h-3" />;
}

function tileBg(status: string | null | undefined) {
  if (status === "completed") return "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/15";
  if (status === "partial") return "bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/15";
  if (status === "skipped") return "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/15";
  if (status === "missed") return "bg-red-950/40 border-red-800/50 text-red-600 hover:bg-red-950/55";
  return "bg-card hover:bg-card/80 border-card-border";
}

function exerciseStatusBadge(status: string) {
  if (status === "completed") return "bg-green-500/15 text-green-400 border-green-500/20";
  if (status === "partial") return "bg-yellow-500/15 text-yellow-400 border-yellow-500/20";
  if (status === "skipped") return "bg-red-500/15 text-red-400 border-red-500/20";
  return "bg-muted text-muted-foreground";
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selected, setSelected] = useState<CalendarDay | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data: calendarData, isLoading } = useGetCalendarData(
    { year, month },
    { query: { queryKey: getGetCalendarDataQueryKey({ year, month }) } }
  );

  const nextMonth = () => setCurrentDate(new Date(year, month, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 2, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = monthStart.getDay();
  const paddingDays = Array.from({ length: startDayOfWeek }).map((_, i) => i);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-semibold w-40 text-center">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-7 gap-4 mb-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-4">
            {paddingDays.map((pad) => (
              <div key={`pad-${pad}`} className="h-24 rounded-xl border border-transparent opacity-20" />
            ))}

            {daysInMonth.map((date) => {
              const dateStr = format(date, "yyyy-MM-dd");
              const dayData = calendarData?.find((d) => d.date === dateStr);
              const isCurrentDay = isToday(date);
              const hasLog = !!dayData?.status;
              const bgClass = tileBg(dayData?.status);

              return (
                <div
                  key={date.toISOString()}
                  onClick={() => hasLog && dayData && setSelected(dayData)}
                  className={cn(
                    "h-24 rounded-xl border p-2 flex flex-col transition-all relative overflow-hidden group",
                    bgClass,
                    hasLog ? "cursor-pointer" : "cursor-default",
                    isCurrentDay && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                >
                  <span className={cn("text-sm font-semibold mb-1", isCurrentDay ? "text-primary" : "text-foreground")}>
                    {format(date, "d")}
                  </span>

                  {isLoading ? (
                    <Skeleton className="w-full h-4 mt-auto opacity-50" />
                  ) : dayData?.focus ? (
                    <div className="mt-auto">
                      <div className="text-xs truncate font-medium opacity-90">{dayData.focus}</div>
                      <div className="text-[10px] opacity-70">C{dayData.cycleNumber} · D{dayData.workoutDayNumber}</div>
                    </div>
                  ) : null}

                  {dayData?.status && (
                    <div className="absolute top-2 right-2 opacity-40 group-hover:opacity-90 transition-opacity">
                      <Dumbbell className="w-3 h-3" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex gap-6 justify-center text-sm">
        {[
          { color: "bg-green-500/50 border-green-500", label: "Completed" },
          { color: "bg-yellow-500/50 border-yellow-500", label: "Partial" },
          { color: "bg-red-500/50 border-red-500", label: "Skipped" },
          { color: "bg-red-950/60 border-red-800", label: "Missed" },
          { color: "bg-card border-card-border", label: "Rest / Upcoming" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded-full border", color)} />
            <span className="text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Day detail dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-md bg-card border-card-border">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <DialogTitle className="text-xl">
                    {format(parseISO(selected.date), "EEEE, MMMM d yyyy")}
                  </DialogTitle>
                  {selected.status && (
                    <Badge
                      className={cn(
                        "capitalize text-xs flex items-center gap-1",
                        selected.status === "completed" && "bg-green-500/15 text-green-400 border-green-500/20",
                        selected.status === "partial" && "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
                        selected.status === "skipped" && "bg-red-500/15 text-red-400 border-red-500/20",
                        selected.status === "missed" && "bg-red-950/60 text-red-500 border-red-800/50"
                      )}
                      variant="outline"
                    >
                      {statusIcon(selected.status)}
                      {selected.status}
                    </Badge>
                  )}
                </div>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {/* Cycle / Day / Focus */}
                <div className="flex items-center gap-3 text-sm">
                  {selected.status === "missed" && (
                    <span className="text-red-500 font-medium">Expected:</span>
                  )}
                  <span className="text-muted-foreground">Cycle {selected.cycleNumber}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">Day {selected.workoutDayNumber}</span>
                  {selected.focus && (
                    <>
                      <span className="text-muted-foreground">·</span>
                      <span className="font-medium text-foreground">{selected.focus}</span>
                    </>
                  )}
                </div>

                {/* Stats row */}
                {(selected.totalCalories || selected.totalCyclingMinutes) && (
                  <div className="flex gap-4">
                    {selected.totalCalories != null && (
                      <div className="flex items-center gap-1.5 text-sm text-orange-400">
                        <Flame className="w-4 h-4" />
                        <span>{selected.totalCalories} kcal</span>
                      </div>
                    )}
                    {selected.totalCyclingMinutes != null && (
                      <div className="flex items-center gap-1.5 text-sm text-blue-400">
                        <Bike className="w-4 h-4" />
                        <span>{selected.totalCyclingMinutes} min cycling</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                {selected.notes && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground bg-card/60 rounded-lg p-3 border border-card-border">
                    <StickyNote className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>{selected.notes}</p>
                  </div>
                )}

                {/* Exercise list */}
                {selected.exerciseSummary && selected.exerciseSummary.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Exercises ({selected.exerciseSummary.length})
                    </p>
                    <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                      {selected.exerciseSummary.map((ex) => (
                        <div key={ex.exerciseId} className="flex items-center justify-between text-sm">
                          <span className="text-foreground/80">{ex.exerciseName}</span>
                          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", exerciseStatusBadge(ex.status))}>
                            {ex.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selected.status === "skipped" && (!selected.exerciseSummary || selected.exerciseSummary.length === 0) && (
                  <p className="text-sm text-muted-foreground italic">Day skipped — no exercises logged.</p>
                )}

                {selected.status === "missed" && (
                  <div className="flex items-start gap-2 text-sm text-red-500/80 bg-red-950/30 rounded-lg p-3 border border-red-900/40">
                    <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>Workout was expected but no log was recorded.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
