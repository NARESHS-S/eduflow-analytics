import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Clock, FileText } from "lucide-react";

const AvailableTests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tests, setTests] = useState<any[]>([]);
  const [attemptCounts, setAttemptCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("tests")
        .select("*, profiles!tests_teacher_id_fkey(full_name)")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      setTests(data || []);

      // Get attempt counts per test
      const { data: attempts } = await supabase
        .from("test_attempts")
        .select("test_id")
        .eq("student_id", user.id)
        .not("completed_at", "is", null);
      
      const counts: Record<string, number> = {};
      (attempts || []).forEach(a => { counts[a.test_id] = (counts[a.test_id] || 0) + 1; });
      setAttemptCounts(counts);
    };
    load();
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Available Tests</h1>
        <p className="text-muted-foreground">Browse and take published tests</p>
      </div>

      {tests.length === 0 ? (
        <Card><CardContent className="pt-6"><p className="text-muted-foreground">No tests available right now.</p></CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tests.map(test => (
            <Card key={test.id} className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{test.title}</CardTitle>
                  {attemptCounts[test.id] && (
                    <Badge variant="secondary">{attemptCounts[test.id]}x attempted</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {test.description && <p className="text-sm text-muted-foreground">{test.description}</p>}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><FileText className="h-4 w-4" /> By {test.profiles?.full_name || "Teacher"}</span>
                  {test.duration_minutes && (
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {test.duration_minutes} min</span>
                  )}
                </div>
                <Button className="w-full" onClick={() => navigate(`/tests/${test.id}/take`)}>
                  {attemptCounts[test.id] ? "Retake Test" : "Start Test"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableTests;
