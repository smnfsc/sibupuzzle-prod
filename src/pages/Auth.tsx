import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Puzzle } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let emailToUse = usernameOrEmail;

      // Check if input is username (no @ sign)
      if (!usernameOrEmail.includes("@")) {
        // Try to get email from username
        const { data, error } = await supabase
          .from("profiles")
          .select("email")
          .eq("username", usernameOrEmail)
          .single();

        if (error || !data) {
          throw new Error("Username non trovato");
        }
        emailToUse = data.email;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });

      if (error) throw error;

      toast({ title: "Accesso effettuato!" });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Credenziali non valide",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Puzzle className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Catalogo Puzzle</h1>
          <p className="text-muted-foreground">Accedi al tuo account</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username o Email</Label>
            <Input
              id="username"
              type="text"
              placeholder="username o email"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Caricamento..." : "Accedi"}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default Auth;
