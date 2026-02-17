import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
} from "recharts";

const Analytics = () => {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("test_attempts")
      .select("*, tests!test_attempts_test_id_fkey(title)")
      .eq("student_id", user.id)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: true })
      .then(({ data }) => setAttempts(data || []));
  }, [user]);

  const progressionData = attempts.map((a: any, i: number) => ({
    attempt: i + 1,
    name: a.tests?.title?.substring(0, 12) || `#${i + 1}`,
    score: Number(a.score) || 0,
  }));

  // Group by test for comparison
  const testGroups: Record<string, any[]> = {};
  attempts.forEach((a: any) => {
    const title = a.tests?.title || "Unknown";
    if (!testGroups[title]) testGroups[title] = [];
    testGroups[title].push(a);
  });

  const comparisonData = Object.entries(testGroups)
    .filter(([, attempts]) => attempts.length > 1)
    .map(([title, attempts]) => ({
      name: title.substring(0, 15),
      first: Number(attempts[0].score) || 0,
      latest: Number(attempts[attempts.length - 1].score) || 0,
    }));

  const avgScore = attempts.length
    ? Math.round(attempts.reduce((s, a) => s + (Number(a.score) || 0), 0) / attempts.length)
    : 0;
  const improving = progressionData.length >= 2
    ? progressionData[progressionData.length - 1].score > progressionData[0].score
    : false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Performance Analytics</h1>
        <p className="text-muted-foreground">Visual insights into your learning progress</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-4xl font-bold">{attempts.length}</p>
            <p className="text-sm text-muted-foreground">Tests Taken</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-4xl font-bold">{avgScore}%</p>
            <p className="text-sm text-muted-foreground">Average Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className={`text-4xl font-bold ${improving ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
              {improving ? "↑" : attempts.length < 2 ? "—" : "↓"}
            </p>
            <p className="text-sm text-muted-foreground">Trend</p>
          </CardContent>
        </Card>
      </div>

      {progressionData.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Score Progression Over Time</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--primary))", r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {comparisonData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>First vs Latest Attempt Comparison</CardTitle>
            <p className="text-sm text-muted-foreground">Comparing your first attempt score with your most recent score</p>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="first" name="First Attempt" fill="hsl(var(--muted-foreground))" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="latest" name="Latest Attempt" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {attempts.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Complete some tests to see your analytics here.
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Analytics;
