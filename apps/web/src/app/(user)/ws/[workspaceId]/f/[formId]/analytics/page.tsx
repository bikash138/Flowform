"use client";

import { use, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import {
  useFormSummary,
  useQuestionStats,
  useGeoStats,
  useTopCities,
} from "@/hooks/user/use-analytics";
import { useFormEditorStore } from "@/store/use-form-editor-store";
import { useWorkspacePlan } from "@/hooks/user/use-billing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PlansModal } from "@/components/modals/plans-modal";
import {
  Eye,
  Users,
  Send,
  TrendingUp,
  Clock,
  ChevronLeft,
  ChevronRight,
  BarChart2,
  Globe,
  MousePointerClick,
  Star,
  Gem,
  Check,
  RefreshCw,
} from "lucide-react";
import type { QuestionStat } from "@flowform/services/analytics";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  const mins = Math.floor(ms / 60_000);
  const secs = Math.round((ms % 60_000) / 1000);
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

function truncate(s: string, max = 28): string {
  return s.length > max ? s.slice(0, max) + "…" : s;
}

function pct(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 1000) / 10;
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  right,
}: {
  icon: React.ElementType;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {right}
    </div>
  );
}

// ─── Upgrade gate ─────────────────────────────────────────────────────────────

function UpgradeGate({
  workspaceId,
  planId,
}: {
  workspaceId: string;
  planId: string;
}) {
  const [plansOpen, setPlansOpen] = useState(false);

  const features = [
    "Views, starts, submissions & completion rate",
    "Visual conversion funnel with drop-off rates",
    "Per-question breakdowns for choice & rating questions",
    "Geographic breakdown by continent, country & city",
    "Average completion time per response",
  ];

  return (
    <>
      <div className="relative rounded-xl overflow-hidden">
        {/* Blurred skeleton preview */}
        <div className="pointer-events-none select-none blur-[3px] opacity-50 space-y-6 p-1">
          {/* KPI skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[Eye, MousePointerClick, Send, TrendingUp, Clock].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-4">
                  <Skeleton className="size-8 rounded-lg mb-3" />
                  <Skeleton className="h-3 w-16 mb-2" />
                  <Skeleton className="h-7 w-12" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Funnel skeleton */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-end gap-2 h-36">
                {[80, 55, 35].map((h, i) => (
                  <div key={i} className="flex items-end gap-2 flex-1">
                    {i > 0 && <Skeleton className="w-6 h-4 self-center" />}
                    <div className="flex flex-col items-center gap-1.5 flex-1">
                      <div className="w-full flex flex-col justify-end" style={{ height: "100px" }}>
                        <Skeleton className="w-full rounded-t-md" style={{ height: `${h}%` }} />
                      </div>
                      <Skeleton className="h-4 w-10" />
                      <Skeleton className="h-3 w-14" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Question cards skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[90, 65, 40, 20].map((w, j) => (
                    <div key={j} className="space-y-1">
                      <div className="flex justify-between">
                        <Skeleton className="h-3" style={{ width: `${w}%` }} />
                        <Skeleton className="h-3 w-10" />
                      </div>
                      <Skeleton className="h-1.5 w-full rounded-full" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Geo skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="p-5 space-y-3">
                  {[1, 2, 3, 4].map((j) => (
                    <Skeleton key={j} className="h-9 w-full rounded-lg" />
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Upgrade overlay */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="bg-background/95 backdrop-blur-sm border border-border rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
            <div className="inline-flex items-center justify-center size-12 rounded-full bg-primary/10 mb-4">
              <Gem className="size-6 text-primary" />
            </div>
            <h3 className="text-base font-bold mb-1.5">Unlock Analytics</h3>
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              Upgrade to <span className="font-semibold text-foreground">Pro</span> to get
              deep insights into how people interact with your forms.
            </p>

            <ul className="space-y-2 mb-6 text-left">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Check className="size-3.5 text-primary shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            <Button
              className="w-full gap-2"
              onClick={() => setPlansOpen(true)}
            >
              <Gem className="size-4" />
              Upgrade to Pro
            </Button>
          </div>
        </div>
      </div>

      <PlansModal
        open={plansOpen}
        onOpenChange={setPlansOpen}
        currentPlanId={planId}
      />
    </>
  );
}

// ─── KPI cards ────────────────────────────────────────────────────────────────

function KpiCards({
  formId,
  workspaceId,
}: {
  formId: string;
  workspaceId: string;
}) {
  const { data, isLoading } = useFormSummary(formId, workspaceId);

  const stats = [
    {
      label: "Views",
      value: data?.views,
      icon: Eye,
      bg: "bg-blue-50 dark:bg-blue-950/30",
      iconColor: "text-blue-500",
    },
    {
      label: "Starts",
      value: data?.starts,
      icon: MousePointerClick,
      bg: "bg-purple-50 dark:bg-purple-950/30",
      iconColor: "text-purple-500",
    },
    {
      label: "Submissions",
      value: data?.submissions,
      icon: Send,
      bg: "bg-green-50 dark:bg-green-950/30",
      iconColor: "text-green-500",
    },
    {
      label: "Completion",
      value: data != null ? `${data.completionRate}%` : undefined,
      icon: TrendingUp,
      bg: "bg-orange-50 dark:bg-orange-950/30",
      iconColor: "text-orange-500",
    },
    {
      label: "Avg. Time",
      value: data?.avgTimeMs != null ? formatDuration(data.avgTimeMs) : "—",
      icon: Clock,
      bg: "bg-muted/40",
      iconColor: "text-muted-foreground",
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map(({ label, value, icon: Icon, bg, iconColor }) => (
        <Card key={label} className="overflow-hidden">
          <CardContent className="p-4">
            <div className={`inline-flex items-center justify-center size-8 rounded-lg mb-3 ${bg}`}>
              <Icon className={`size-4 ${iconColor}`} />
            </div>
            <p className="text-xs text-muted-foreground font-medium mb-1">{label}</p>
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <p className="text-2xl font-bold tabular-nums tracking-tight">
                {value ?? "—"}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Conversion funnel ────────────────────────────────────────────────────────

function ConversionFunnel({
  formId,
  workspaceId,
}: {
  formId: string;
  workspaceId: string;
}) {
  const { data, isLoading } = useFormSummary(formId, workspaceId);

  const steps = [
    { label: "Views",       value: data?.views       ?? 0, color: "bg-blue-500"   },
    { label: "Starts",      value: data?.starts      ?? 0, color: "bg-purple-500" },
    { label: "Submissions", value: data?.submissions ?? 0, color: "bg-green-500"  },
  ];
  const maxVal = steps[0]?.value ?? 1;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-end gap-1 h-36">
          {steps.map((step, i) => {
            const widthPct = maxVal > 0 ? (step.value / maxVal) * 100 : 0;
            const dropPct =
              i > 0 && steps[i - 1]!.value > 0
                ? pct(step.value, steps[i - 1]!.value)
                : null;

            return (
              <div key={step.label} className="flex items-end gap-1 flex-1 min-w-0">
                {i > 0 && (
                  <div className="flex flex-col items-center justify-center self-stretch w-8 shrink-0 gap-0.5">
                    <ChevronRight className="size-3.5 text-muted-foreground/50" />
                    {dropPct !== null && !isLoading && (
                      <span className="text-[9px] text-muted-foreground tabular-nums leading-none">
                        {dropPct}%
                      </span>
                    )}
                  </div>
                )}
                <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                  <div className="w-full flex flex-col justify-end" style={{ height: "100px" }}>
                    {isLoading ? (
                      <Skeleton className="w-full rounded-t-md" style={{ height: "60%" }} />
                    ) : (
                      <div
                        className={`w-full rounded-t-md transition-all ${step.color} opacity-85`}
                        style={{ height: `${Math.max(4, widthPct)}%` }}
                      />
                    )}
                  </div>
                  <div className="text-center w-full min-w-0">
                    {isLoading ? (
                      <Skeleton className="h-4 w-10 mx-auto mb-1" />
                    ) : (
                      <p className="text-sm font-bold tabular-nums">
                        {step.value.toLocaleString()}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground truncate">{step.label}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Option bars (radio / checkbox / select) ──────────────────────────────────

type OptionQuestion = QuestionStat & { type: "radio" | "checkbox" | "select" };

function OptionBars({ question }: { question: OptionQuestion }) {
  return (
    <div className="space-y-3">
      {question.stats.options.map((opt, i) => (
        <div key={i} className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs min-w-0 flex-1 truncate" title={opt.label}>
              {opt.label}
            </span>
            <span className="text-xs font-semibold tabular-nums shrink-0">
              {opt.percentage}%
            </span>
            <span className="text-xs text-muted-foreground tabular-nums shrink-0 w-8 text-right">
              {opt.count}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${opt.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Rating chart ─────────────────────────────────────────────────────────────

type RatingQuestion = QuestionStat & { type: "rating" };

function RatingChart({ question }: { question: RatingQuestion }) {
  const data = question.stats.distribution.map((d) => ({
    star: `${d.value}★`,
    count: d.count,
  }));
  const stars = Math.round(question.stats.avgScore);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-4xl font-bold tabular-nums tracking-tight">
          {question.stats.avgScore.toFixed(1)}
        </span>
        <div className="flex flex-col gap-1">
          <div className="flex gap-0.5">
            {Array.from({ length: question.stats.distribution.length }).map((_, i) => (
              <Star
                key={i}
                className={`size-3.5 ${i < stars ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"}`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">avg. score</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
          <XAxis dataKey="star" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
          <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} contentStyle={{ fontSize: 12 }} />
          <Bar dataKey="count" fill="#f59e0b" radius={[3, 3, 0, 0]}>
            <LabelList dataKey="count" position="top" style={{ fontSize: 10, fill: "#9ca3af" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Question stats ───────────────────────────────────────────────────────────

function QuestionStatsSection({
  formId,
  workspaceId,
  publishVersion,
  selectedVersion,
  onVersionChange,
}: {
  formId: string;
  workspaceId: string;
  publishVersion: number;
  selectedVersion: number;
  onVersionChange: (v: number) => void;
}) {
  const { data, isLoading, isError } = useQuestionStats(formId, workspaceId, selectedVersion);
  const versions = Array.from({ length: publishVersion }, (_, i) => publishVersion - i);

  const versionPicker = (
    <Select
      value={String(selectedVersion)}
      onValueChange={(v) => onVersionChange(Number(v))}
    >
      <SelectTrigger className="w-32 h-7 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {versions.map((v) => (
          <SelectItem key={v} value={String(v)}>
            Version {v}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={BarChart2}
        title="Question Insights"
        right={
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <RefreshCw className="size-3 shrink-0" />
              Updates every 2 min
            </span>
            {versionPicker}
          </div>
        }
      />

      {isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-2.5">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-3/5" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isError && (
        <Card>
          <CardContent className="py-14 text-center">
            <BarChart2 className="size-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">Could not load question data</p>
            <p className="text-xs text-muted-foreground">
              This usually means no published snapshot exists for this version.
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && data?.questions.length === 0 && (
        <Card>
          <CardContent className="py-14 text-center">
            <BarChart2 className="size-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">No chart data yet</p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              {data?.totalResponses === 0
                ? "No responses have been collected for this version yet."
                : "Add radio, select, checkbox, or rating questions to see charts."}
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && data && data.questions.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground">
            Based on{" "}
            <span className="font-medium text-foreground">
              {data.totalResponses.toLocaleString()}
            </span>{" "}
            response{data.totalResponses !== 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data.questions.map((q) => (
              <Card key={q.questionId}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-xs font-semibold leading-snug line-clamp-2" title={q.label}>
                      {q.label}
                    </CardTitle>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 shrink-0 capitalize">
                      {q.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {(q.type === "radio" || q.type === "checkbox" || q.type === "select") && (
                    <OptionBars question={q as OptionQuestion} />
                  )}
                  {q.type === "rating" && <RatingChart question={q as RatingQuestion} />}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Geo section ──────────────────────────────────────────────────────────────

function GeoSection({ formId, workspaceId }: { formId: string; workspaceId: string }) {
  const [selectedContinent, setSelectedContinent] = useState<string | null>(null);
  const { data: geoData, isLoading: geoLoading } = useGeoStats(formId, workspaceId);
  const { data: citiesData, isLoading: citiesLoading } = useTopCities(formId, workspaceId, selectedContinent);

  const continentData = geoData
    ? Object.entries(geoData.continents)
        .filter(([, n]) => n > 0)
        .sort(([, a], [, b]) => b - a)
        .map(([name, count]) => ({ name, count }))
    : [];
  const totalGeo = continentData.reduce((s, c) => s + c.count, 0);

  return (
    <div className="space-y-4">
      <SectionHeader icon={Globe} title="Geographic Breakdown" />

      {geoLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                {[1, 2, 3, 4].map((j) => <Skeleton key={j} className="h-9 w-full rounded-lg" />)}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!geoLoading && continentData.length === 0 && (
        <Card>
          <CardContent className="py-14 text-center">
            <Globe className="size-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">No location data yet</p>
            <p className="text-xs text-muted-foreground">
              Geographic data will appear as responses come in.
            </p>
          </CardContent>
        </Card>
      )}

      {!geoLoading && continentData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold">By Continent</CardTitle>
              <p className="text-xs text-muted-foreground">Click a row to drill into cities</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {continentData.map((entry) => {
                const share = pct(entry.count, totalGeo);
                const isSelected = selectedContinent === entry.name;
                return (
                  <button
                    key={entry.name}
                    type="button"
                    onClick={() => setSelectedContinent(isSelected ? null : entry.name)}
                    className={`w-full text-left rounded-lg px-3 py-2 transition-colors ${
                      isSelected ? "bg-primary/8 ring-1 ring-primary/20" : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <span className="text-xs font-medium truncate">{entry.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground tabular-nums">{entry.count.toLocaleString()}</span>
                        <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">{share}%</span>
                      </div>
                    </div>
                    <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isSelected ? "bg-primary" : "bg-primary/50"}`}
                        style={{ width: `${share}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-1.5">
                {selectedContinent && (
                  <button
                    type="button"
                    onClick={() => setSelectedContinent(null)}
                    className="p-0.5 rounded hover:bg-muted transition-colors shrink-0"
                  >
                    <ChevronLeft className="size-3.5" />
                  </button>
                )}
                <CardTitle className="text-xs font-semibold truncate">
                  {selectedContinent ? `Top Cities — ${selectedContinent}` : "Top Cities"}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {!selectedContinent && (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                  <Globe className="size-7 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">Select a continent to see top cities</p>
                </div>
              )}
              {selectedContinent && citiesLoading && (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-7 w-full" />)}
                </div>
              )}
              {selectedContinent && !citiesLoading && citiesData && (
                <div className="space-y-2.5">
                  {citiesData.cities.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-10">No city data available.</p>
                  ) : (
                    citiesData.cities.map((city, idx) => {
                      const maxCount = citiesData.cities[0]?.count ?? 1;
                      const share = pct(city.count, maxCount);
                      return (
                        <div key={city.city} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-4 shrink-0 tabular-nums text-right">{idx + 1}</span>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-medium truncate">{city.city}</span>
                              <span className="text-xs text-muted-foreground tabular-nums shrink-0">{city.count.toLocaleString()}</span>
                            </div>
                            <div className="h-1 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary/60 rounded-full" style={{ width: `${share}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage({
  params,
}: {
  params: Promise<{ workspaceId: string; formId: string }>;
}) {
  const { workspaceId, formId } = use(params);
  const publishVersion = useFormEditorStore((s) => s.form?.publishVersion ?? 0);
  const [selectedVersion, setSelectedVersion] = useState(publishVersion);
  const { data: plan, isLoading: planLoading } = useWorkspacePlan(workspaceId);

  if (publishVersion === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <BarChart2 className="size-10 text-muted-foreground/30" />
          <p className="font-medium">No data yet</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Publish your form to start collecting responses and seeing analytics.
          </p>
        </div>
      </div>
    );
  }

  const isFree = !planLoading && (plan?.planId ?? "FREE") === "FREE";

  if (isFree) {
    return (
      <div className="w-full h-full overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <UpgradeGate workspaceId={workspaceId} planId={plan?.planId ?? "FREE"} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-8">
        <KpiCards formId={formId} workspaceId={workspaceId} />

        <div className="space-y-4">
          <SectionHeader icon={TrendingUp} title="Conversion Funnel" />
          <ConversionFunnel formId={formId} workspaceId={workspaceId} />
        </div>

        <QuestionStatsSection
          formId={formId}
          workspaceId={workspaceId}
          publishVersion={publishVersion}
          selectedVersion={selectedVersion}
          onVersionChange={setSelectedVersion}
        />

        <GeoSection formId={formId} workspaceId={workspaceId} />
      </div>
    </div>
  );
}
