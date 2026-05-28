import { useTimer, formatTime } from "@/hooks/use-timer";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimerWidgetProps {
  label: string;
  totalSeconds: number;
  mode?: "rest" | "exercise";
}

const SIZE = 96;
const STROKE = 7;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function TimerWidget({ label, totalSeconds, mode = "rest" }: TimerWidgetProps) {
  const { toast } = useToast();

  const { timeLeft, isRunning, isDone, start, pause, reset } = useTimer(totalSeconds, () => {
    toast({
      title: mode === "rest" ? "Rest complete — go!" : "Time's up!",
      description: label,
      duration: 4000,
    });
  });

  const progress = totalSeconds > 0 ? timeLeft / totalSeconds : 0;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const ringColor = mode === "exercise" ? "text-primary" : "text-blue-400";
  const trackColor = mode === "exercise" ? "text-primary/15" : "text-blue-400/15";
  const labelColor = mode === "exercise" ? "text-primary" : "text-blue-400";

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Circular ring */}
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          {/* Track */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            className={cn("stroke-current", trackColor)}
          />
          {/* Progress */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className={cn("stroke-current transition-[stroke-dashoffset] duration-1000 ease-linear", ringColor, isDone && "opacity-40")}
          />
        </svg>
        {/* Centred time */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("text-base font-bold tabular-nums tracking-tight", isDone ? "text-muted-foreground" : "text-foreground")}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Label */}
      <p className={cn("text-[11px] font-medium uppercase tracking-wider", labelColor)}>{label}</p>

      {/* Controls */}
      <div className="flex items-center gap-1.5">
        {!isDone ? (
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-3 text-xs"
            onClick={isRunning ? pause : start}
          >
            {isRunning ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
            {isRunning ? "Pause" : "Start"}
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground font-medium">Done ✓</span>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={reset}
          title="Reset"
        >
          <RotateCcw className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
