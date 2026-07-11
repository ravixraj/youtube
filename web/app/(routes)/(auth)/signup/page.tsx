"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

export default function SignUpPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    fullname: "",
    email: "",
    password: "",
  });

  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await register({
      username: formData.username,
      fullname: formData.fullname,
      email: formData.email,
      password: formData.password,
    });

    if (result.success) {
      router.push("/home");
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-2xl font-semibold uppercase">
          signup to UTube
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">UserName</Label>
            <Input
              type="text"
              id="username"
              placeholder="UserName"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullname">FullName</Label>
            <Input
              type="text"
              id="fullname"
              placeholder="Fullname"
              value={formData.fullname}
              onChange={(e) =>
                setFormData({ ...formData, fullname: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              type="password"
              id="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />
            <p className="text-xs text-muted-foreground">
              Min 6 chars, must include uppercase, lowercase, number & special
              character
            </p>
          </div>

          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? "Signing Up..." : "Sign Up"}
          </Button>
        </form>

        <p className="mt-6 text-sm font-light text-center">
          Already registered?{" "}
          <Link
            className="cursor-pointer font-bold hover:underline"
            href={"/signin"}
          >
            Sign in to your account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
