import { useGetCalendarData, getGetCalendarDataQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1-indexed for API
  
  const { data: calendarData, isLoading } = useGetCalendarData({ year, month });

  const nextMonth = () => setCurrentDate(new Date(year, month, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 2, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Pad the beginning of the calendar grid
  const startDayOfWeek = monthStart.getDay(); // 0 is Sunday
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
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
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
              const dayData = calendarData?.find(d => d.date === dateStr);
              
              let bgClass = "bg-card hover:bg-card-hover border-card-border";
              if (dayData?.status === "completed") bgClass = "bg-green-500/10 border-green-500/30 text-green-400";
              else if (dayData?.status === "partial") bgClass = "bg-yellow-500/10 border-yellow-500/30 text-yellow-400";
              else if (dayData?.status === "skipped") bgClass = "bg-red-500/10 border-red-500/30 text-red-400";
              
              const isCurrentDay = isToday(date);
              
              return (
                <div 
                  key={date.toISOString()} 
                  className={cn(
                    "h-24 rounded-xl border p-2 flex flex-col transition-all cursor-pointer relative overflow-hidden group",
                    bgClass,
                    isCurrentDay && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                >
                  <span className={cn(
                    "text-sm font-semibold mb-1",
                    isCurrentDay ? "text-primary" : "text-foreground"
                  )}>
                    {format(date, "d")}
                  </span>
                  
                  {isLoading ? (
                    <Skeleton className="w-full h-4 mt-auto opacity-50" />
                  ) : dayData?.focus ? (
                    <div className="mt-auto">
                      <div className="text-xs truncate font-medium opacity-90">{dayData.focus}</div>
                      <div className="text-[10px] opacity-70">Cycle {dayData.cycleNumber} &bull; Day {dayData.workoutDayNumber}</div>
                    </div>
                  ) : null}
                  
                  {dayData?.status && (
                    <div className="absolute top-2 right-2 opacity-50 group-hover:opacity-100 transition-opacity">
                      <Dumbbell className="w-3 h-3" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      <div className="flex gap-6 justify-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500/50 border border-green-500" />
          <span className="text-muted-foreground">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500/50 border border-yellow-500" />
          <span className="text-muted-foreground">Partial</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/50 border border-red-500" />
          <span className="text-muted-foreground">Skipped</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-card border border-card-border" />
          <span className="text-muted-foreground">Rest / Upcoming</span>
        </div>
      </div>
    </div>
  );
}
