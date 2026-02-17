import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, BarChart3, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ tests: 0, attempts: 0, avgScore: 0, feedbackCount: 0 });
  const [recentAttempts, setRecentAttempts] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: tests } = await supabase.from("tests").select("id").eq("teacher_id", user.id);
      const testIds = tests?.map(t => t.id) || [];

      let attempts: any[] = [];
      let feedbackCount = 0;
      if (testIds.length > 0) {
        const { data: att } = await supabase
          .from("test_attempts")
          .select("*, profiles!test_attempts_student_id_fkey(full_name), tests!test_attempts_test_id_fkey(title)")
          .in("test_id", testIds)
          .not("completed_at", "is", null)
          .order("completed_at", { ascending: false })
          .limit(10);
        attempts = att || [];

        const { count } = await supabase
          .from("feedback")
          .select("id", { count: "exact", head: true })
          .eq("teacher_id", user.id);
        feedbackCount = count || 0;
      }

      const totalScore = attempts.reduce((sum: number, a: any) => sum + (Number(a.score) || 0), 0);
      setStats({
        tests: testIds.length,
        attempts: attempts.length,
        avgScore: attempts.length ? Math.round(totalScore / attempts.length) : 0,
        feedbackCount,
      });
      setRecentAttempts(attempts);
    };
    load();
  }, [user]);

  const chartData = recentAttempts.map((a: any) => ({
    name: a.profiles?.full_name?.split(" ")[0] || "Student",
    score: Number(a.score) || 0,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
        <p className="text-muted-foreground">Overview of your tests and student performance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Tests", value: stats.tests, icon: FileText, color: "text-primary" },
          { label: "Test Attempts", value: stats.attempts, icon: Users, color: "text-accent" },
          { label: "Avg Score", value: `${stats.avgScore}%`, icon: BarChart3, color: "text-chart-3" },
          { label: "Feedback Sent", value: stats.feedbackCount, icon: MessageSquare, color: "text-chart-4" },
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
