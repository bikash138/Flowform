"use client";

import { use, useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
} from "recharts";
import {
  useFormSummary,
  useQuestionStats,
  useGeoStats,
  useTopCities,
} from "@/hooks/user/use-analytics";
import { useFormEditorStore } from "@/store/use-form-editor-store";
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
import { Eye, Users, Send, TrendingUp, Clock, ChevronLeft } from "lucide-react";
import type { QuestionStat } from "@flowform/services/analytics";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  const mins = Math.floor(ms / 60_000);
  const secs = Math.round((ms % 60_000) / 1000);
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

function truncate(s: string, max = 22): string {
  return s.length > max ? s.slice(0, max) + "…" : s;
}

// ─── Summary cards ────────────────────────────────────────────────────────────

function SummaryCards({
  formId,
  workspaceId,
}: {
  formId: string;
  workspaceId: string;
}) {
  const { data, isLoading } = useFormSummary(formId, workspaceId);

  const stats = [
    { label: "Views", value: data?.views, icon: Eye, color: "text-blue-500" },
    { label: "Starts", value: data?.starts, icon: Users, color: "text-purple-500" },
    { label: "Submissions", value: data?.submissions, icon: Send, color: "text-green-500" },
    {
      label: "Completion",
      value: data != null ? `${data.completionRate}%` : undefined,
      icon: TrendingUp,
      color: "text-orange-500",
    },
    {
      label: "Avg. Time",
      value: data?.avgTimeMs != null ? formatDuration(data.avgTimeMs) : "—",
      icon: Clock,
      color: "text-muted-foreground",
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <Card key={label}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`size-4 ${color}`} />
              <span className="text-xs text-muted-foreground font-medium">{label}</span>
            </div>
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <p className="text-2xl font-bold tabular-nums">{value ?? "—"}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Option chart (radio / checkbox / select) ─────────────────────────────────

type OptionQuestion = QuestionStat & { type: "radio" | "checkbox" | "select" };

function OptionBarChart({ question }: { question: OptionQuestion }) {
  const data = question.stats.options.map((opt) => ({
    label: truncate(opt.label),
    count: opt.count,
    pct: opt.percentage,
  }));
  const height = Math.max(120, data.length * 48);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ left: 4, right: 52, top: 4, bottom: 4 }}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          width={130}
          tick={{ fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(val, _, props) => [
            `${val} (${(props.payload as { pct: number }).pct}%)`,
            "Responses",
          ]}
          cursor={{ fill: "rgba(0,0,0,0.04)" }}
        />
        <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]}>
          <LabelList
            dataKey="pct"
            position="right"
            formatter={(v: unknown) => `${v}%`}
            style={{ fontSize: 11, fill: "#6b7280" }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Rating chart ─────────────────────────────────────────────────────────────

type RatingQuestion = QuestionStat & { type: "rating" };

function RatingBarChart({ question }: { question: RatingQuestion }) {
  const data = question.stats.distribution.map((d) => ({
    star: `${d.value}★`,
    count: d.count,
  }));

  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold tabular-nums">
          {question.stats.avgScore.toFixed(1)}
        </span>
        <span className="text-sm text-muted-foreground">avg. score</span>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} margin={{ left: 0, right: 0, top: 4, bottom: 4 }}>
          <XAxis dataKey="star" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} />
          <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]}>
            <LabelList
              dataKey="count"
              position="top"
              style={{ fontSize: 11, fill: "#6b7280" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Question stats section ───────────────────────────────────────────────────

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
  const { data, isLoading } = useQuestionStats(formId, workspaceId, selectedVersion);
  const versions = Array.from({ length: publishVersion }, (_, i) => publishVersion - i);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold">Question Analytics</h2>
        <Select
          value={String(selectedVersion)}
          onValueChange={(v) => onVersionChange(Number(v))}
        >
          <SelectTrigger className="w-36 h-8 text-xs">
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
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && data?.questions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {data.totalResponses === 0
              ? "No responses collected yet for this version."
              : "No chartable questions (radio, select, checkbox, rating) in this version."}
          </CardContent>
        </Card>
      )}

      {!isLoading && data && data.questions.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground">
            Based on {data.totalResponses} response
            {data.totalResponses !== 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data.questions.map((q) => (
              <Card key={q.questionId}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-medium leading-snug">
                      {q.label}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs shrink-0 capitalize">
                      {q.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {(q.type === "radio" ||
                    q.type === "checkbox" ||
                    q.type === "select") && <OptionBarChart question={q} />}
                  {q.type === "rating" && <RatingBarChart question={q} />}
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

function GeoSection({
  formId,
  workspaceId,
}: {
  formId: string;
  workspaceId: string;
}) {
  const [selectedContinent, setSelectedContinent] = useState<string | null>(null);
  const { data: geoData, isLoading: geoLoading } = useGeoStats(formId, workspaceId);
  const { data: citiesData, isLoading: citiesLoading } = useTopCities(
    formId,
    workspaceId,
    selectedContinent,
  );

  const continentData = geoData
    ? Object.entries(geoData.continents)
        .filter(([, n]) => n > 0)
        .sort(([, a], [, b]) => b - a)
        .map(([name, count]) => ({ name, count }))
    : [];

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold">Geographic Breakdown</h2>

      {geoLoading && <Skeleton className="h-52 w-full rounded-xl" />}

      {!geoLoading && continentData.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No geographic data yet.
          </CardContent>
        </Card>
      )}

      {!geoLoading && continentData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium">By Continent</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Click a bar to drill into cities
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer
                width="100%"
                height={Math.max(140, continentData.length * 44)}
              >
                <BarChart
                  data={continentData}
                  layout="vertical"
                  margin={{ left: 4, right: 48, top: 4, bottom: 4 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                  <Bar
                    dataKey="count"
                    radius={[0, 4, 4, 0]}
                    cursor="pointer"
                    onClick={(d) => {
                      const name = (d as { name: string }).name;
                      setSelectedContinent(name === selectedContinent ? null : name);
                    }}
                  >
                    {continentData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={entry.name === selectedContinent ? "#6366f1" : "#10b981"}
                      />
                    ))}
                    <LabelList
                      dataKey="count"
                      position="right"
                      style={{ fontSize: 11, fill: "#6b7280" }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1">
              <div className="flex items-center gap-1.5">
                {selectedContinent && (
                  <button
                    onClick={() => setSelectedContinent(null)}
                    className="p-0.5 rounded hover:bg-muted transition-colors"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                )}
                <CardTitle className="text-sm font-medium">
                  {selectedContinent
                    ? `Top Cities — ${selectedContinent}`
                    : "Top Cities"}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {!selectedContinent && (
                <p className="text-sm text-muted-foreground text-center py-10">
                  Select a continent to see top cities.
                </p>
              )}

              {selectedContinent && citiesLoading && (
                <div className="space-y-2 pt-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              )}

              {selectedContinent && !citiesLoading && citiesData && (
                <div className="space-y-3 pt-1">
                  {citiesData.cities.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-10">
                      No city data available.
                    </p>
                  ) : (
                    citiesData.cities.map((city, idx) => {
                      const maxCount = citiesData.cities[0]?.count ?? 1;
                      const pct = Math.round((city.count / maxCount) * 100);
                      return (
                        <div key={city.city} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-4 shrink-0 tabular-nums">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm truncate">{city.city}</span>
                              <span className="text-xs text-muted-foreground tabular-nums ml-3 shrink-0">
                                {city.count}
                              </span>
                            </div>
                            <div className="h-1 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${pct}%` }}
                              />
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
  const [selectedVersion, setSelectedVersion] = useState(0);

  useEffect(() => {
    if (publishVersion > 0 && selectedVersion === 0) {
      setSelectedVersion(publishVersion);
    }
  }, [publishVersion, selectedVersion]);

  if (publishVersion === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="font-medium">Form not published yet</p>
          <p className="text-sm text-muted-foreground">
            Publish your form to start collecting responses and viewing analytics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-8">
        <SummaryCards formId={formId} workspaceId={workspaceId} />

        {selectedVersion > 0 && (
          <QuestionStatsSection
            formId={formId}
            workspaceId={workspaceId}
            publishVersion={publishVersion}
            selectedVersion={selectedVersion}
            onVersionChange={setSelectedVersion}
          />
        )}

        <GeoSection formId={formId} workspaceId={workspaceId} />
      </div>
    </div>
  );
}
