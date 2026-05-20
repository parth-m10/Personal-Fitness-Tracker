import { useGetBodyMetrics, useCreateBodyMetric, useDeleteBodyMetric, getGetBodyMetricsQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Trash2, Scale, Ruler, Plus } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

const metricSchema = z.object({
  date: z.string(),
  weightKg: z.coerce.number().optional().or(z.literal('')),
  waistCm: z.coerce.number().optional().or(z.literal('')),
  chestCm: z.coerce.number().optional().or(z.literal('')),
  bellyCm: z.coerce.number().optional().or(z.literal('')),
  notes: z.string().optional(),
});

export default function Metrics() {
  const { data: metrics, isLoading } = useGetBodyMetrics({ days: 90 });
  const createMetric = useCreateBodyMetric();
  const deleteMetric = useDeleteBodyMetric();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof metricSchema>>({
    resolver: zodResolver(metricSchema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      weightKg: '',
      waistCm: '',
      chestCm: '',
      bellyCm: '',
      notes: ''
    }
  });

  const onSubmit = (values: z.infer<typeof metricSchema>) => {
    const data = {
      ...values,
      weightKg: values.weightKg ? Number(values.weightKg) : null,
      waistCm: values.waistCm ? Number(values.waistCm) : null,
      chestCm: values.chestCm ? Number(values.chestCm) : null,
      bellyCm: values.bellyCm ? Number(values.bellyCm) : null,
    };
    
    // Clean nulls
    Object.keys(data).forEach(key => {
      if (data[key as keyof typeof data] === null) delete data[key as keyof typeof data];
    });

    createMetric.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Metric logged successfully" });
        queryClient.invalidateQueries({ queryKey: getGetBodyMetricsQueryKey({ days: 90 }) });
        form.reset();
        form.setValue("date", format(new Date(), "yyyy-MM-dd"));
      },
      onError: (err) => {
        toast({ title: "Failed to log metric", description: String(err), variant: "destructive" });
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteMetric.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Metric deleted" });
        queryClient.invalidateQueries({ queryKey: getGetBodyMetricsQueryKey({ days: 90 }) });
      }
    });
  };

  const chartData = [...(metrics || [])].reverse().map(m => ({
    ...m,
    dateFormatted: format(parseISO(m.date), "MMM d")
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Body Metrics</h1>
        <p className="text-muted-foreground mt-2">Track weight and measurements over time.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 bg-card/50 backdrop-blur-sm border-card-border h-fit">
          <CardHeader>
            <CardTitle>Log Measurement</CardTitle>
            <CardDescription>Enter metrics for a specific date</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="bg-card" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="weightKg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight (kg)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Scale className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input type="number" step="0.1" className="pl-9 bg-card" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="waistCm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Waist (cm)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Ruler className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input type="number" step="0.1" className="pl-9 bg-card" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="chestCm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chest (cm)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Ruler className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input type="number" step="0.1" className="pl-9 bg-card" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bellyCm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Belly (cm)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Ruler className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input type="number" step="0.1" className="pl-9 bg-card" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="How did you feel today?" className="bg-card resize-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={createMetric.isPending}>
                  <Plus className="w-4 h-4 mr-2" /> Log Metrics
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card/50 backdrop-blur-sm border-card-border">
            <CardHeader>
              <CardTitle>Weight Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              {isLoading ? <Skeleton className="h-full w-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="dateFormatted" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis domain={['auto', 'auto']} stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e1e2d', borderColor: '#333', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="weightKg" name="Weight (kg)" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, fill: '#0ea5e9' }} activeDot={{ r: 6 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-card-border">
            <CardHeader>
              <CardTitle>Measurements (cm)</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              {isLoading ? <Skeleton className="h-full w-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="dateFormatted" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis domain={['auto', 'auto']} stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e1e2d', borderColor: '#333', borderRadius: '8px' }} />
                    <Legend />
                    <Line type="monotone" dataKey="chestCm" name="Chest" stroke="#22c55e" strokeWidth={2} dot={false} connectNulls />
                    <Line type="monotone" dataKey="waistCm" name="Waist" stroke="#f59e0b" strokeWidth={2} dot={false} connectNulls />
                    <Line type="monotone" dataKey="bellyCm" name="Belly" stroke="#ef4444" strokeWidth={2} dot={false} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-card-border">
            <CardHeader>
              <CardTitle>Recent Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics?.slice(0, 5).map(m => (
                  <div key={m.id} className="flex justify-between items-center p-3 rounded-lg border border-card-border bg-card">
                    <div>
                      <div className="font-medium">{format(parseISO(m.date), "MMMM d, yyyy")}</div>
                      <div className="text-sm text-muted-foreground mt-1 flex gap-3">
                        {m.weightKg && <span>{m.weightKg}kg</span>}
                        {m.waistCm && <span>Waist: {m.waistCm}cm</span>}
                        {m.chestCm && <span>Chest: {m.chestCm}cm</span>}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {!metrics?.length && !isLoading && (
                  <div className="text-center text-muted-foreground py-4">No metrics logged yet.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
