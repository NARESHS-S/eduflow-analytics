import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Users, BarChart3, MessageSquare, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ tests: 0, published: 0, drafts: 0, totalStudents: 0, attempts: 0, avgScore: 0, feedbackCount: 0, passRate: 0 });
  const [recentAttempts, setRecentAttempts] = useState<any[]>([]);
  const [testBreakdown, setTestBreakdown] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: tests } = await supabase.from("tests").select("id, title, is_published").eq("teacher_id", user.id);
      const allTests = tests || [];
      const testIds = allTests.map(t => t.id);
      const published = allTests.filter(t => t.is_published).length;

      let attempts: any[] = [];
      let feedbackCount = 0;
      let uniqueStudents = new Set<string>();

      if (testIds.length > 0) {
        const { data: att } = await supabase
          .from("test_attempts")
          .select("*, profiles!test_attempts_student_id_fkey(full_name, email), tests!test_attempts_test_id_fkey(title)")
          .in("test_id", testIds)
          .not("completed_at", "is", null)
          .order("completed_at", { ascending: false });
        attempts = att || [];
        attempts.forEach(a => uniqueStudents.add(a.student_id));

        const { count } = await supabase
          .from("feedback")
          .select("id", { count: "exact", head: true })
          .eq("teacher_id", user.id);
        feedbackCount = count || 0;
      }

      const scores = attempts.map(a => Number(a.score) || 0);
      const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      const passRate = scores.length ? Math.round((scores.filter(s => s >= 50).length / scores.length) * 100) : 0;

      // Per-test breakdown
      const breakdown: Record<string, { title: string; attempts: number; avg: number }> = {};
      attempts.forEach(a => {
        if (!breakdown[a.test_id]) breakdown[a.test_id] = { title: a.tests?.title || "Test", attempts: 0, avg: 0 };
        breakdown[a.test_id].attempts++;
        breakdown[a.test_id].avg += Number(a.score) || 0;
      });
      Object.values(breakdown).forEach(b => { b.avg = Math.round(b.avg / b.attempts); });

      setStats({
        tests: allTests.length,
        published,
        drafts: allTests.length - published,
        totalStudents: uniqueStudents.size,
        attempts: attempts.length,
        avgScore,
        feedbackCount,
        passRate,
      });
      setRecentAttempts(attempts.slice(0, 10));
      setTestBreakdown(Object.values(breakdown));
    };
    load();
  }, [user]);

  const chartData = recentAttempts.map((a: any) => ({
    name: a.profiles?.full_name?.split(" ")[0] || "Student",
    score: Number(a.score) || 0,
  }));

  const pieData = [
    { name: "Published", value: stats.published },
    { name: "Drafts", value: stats.drafts },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
        <p className="text-muted-foreground">Overview of your tests, students, and performance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Tests", value: stats.tests, icon: FileText, color: "text-primary" },
          { label: "Total Students", value: stats.totalStudents, icon: Users, color: "text-accent" },
          { label: "Avg Score", value: `${stats.avgScore}%`, icon: BarChart3, color: "text-chart-3" },
          { label: "Pass Rate", value: `${stats.passRate}%`, icon: CheckCircle, color: "text-chart-4" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className={`rounded-xl bg-secondary p-3 ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {chartData.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Recent Scores</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="score" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {pieData.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Test Status</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {testBreakdown.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Per-Test Performance</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testBreakdown.map((t, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">{t.title}</p>
                    <p className="text-sm text-muted-foreground">{t.attempts} attempt{t.attempts !== 1 ? "s" : ""}</p>
                  </div>
                  <Badge variant={t.avg >= 70 ? "default" : t.avg >= 50 ? "secondary" : "destructive"}>
                    Avg: {t.avg}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Recent Attempts</CardTitle></CardHeader>
        <CardContent>
          {recentAttempts.length === 0 ? (
            <p className="text-muted-foreground">No test attempts yet. <Link to="/tests/create" className="text-primary underline">Create a test</Link> to get started.</p>
          ) : (
            <div className="space-y-3">
              {recentAttempts.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">{a.profiles?.full_name || "Student"}</p>
                    <p className="text-sm text-muted-foreground">{a.tests?.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{Number(a.score).toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">{a.earned_points}/{a.total_points} pts</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherDashboard;
