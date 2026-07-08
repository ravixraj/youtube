"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

export default function SignUpPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
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

    const data = new FormData();
    data.append("username", formData.username);
    data.append("fullname", formData.fullname);
    data.append("email", formData.email);
    data.append("password", formData.password);
    if (avatarFile) data.append("avatar", avatarFile);

    const result = await register(data);

    if (result.success) {
      router.push("/home");
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <>
      <div className="mb-6 w-full text-center text-2xl font-semibold uppercase">
        signup to youtube
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full">
        <div className="grid w-full max-w-sm items-center gap-3 mt-3">
          <Label htmlFor="email">Email</Label>
          <Input
            className="bg-input"
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

        <div className="grid w-full max-w-sm items-center gap-3 mt-3">
          <Label htmlFor="username">UserName</Label>
          <Input
            className="bg-input"
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

        <div className="grid w-full max-w-sm items-center gap-3 mt-3">
          <Label htmlFor="fullname">FullName</Label>
          <Input
            className="bg-input"
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

        <div className="grid w-full max-w-sm items-center gap-3 mt-3">
          <Label htmlFor="password">Password</Label>
          <Input
            className="bg-input"
            type="password"
            id="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            required
          />
        </div>

        <div className="grid w-full max-w-sm items-center gap-3 mt-3">
          <Label htmlFor="avatar">Avatar (Optional)</Label>
          <Input
            className="bg-input"
            type="file"
            id="avatar"
            accept="image/*"
            onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
          />
        </div>

        <Button className="mt-5 w-full" type="submit" disabled={loading}>
          {loading ? "Signing Up..." : "Sign Up"}
        </Button>
      </form>

      <p className="my-14 text-sm font-light">
        Already registered?{" "}
        <Link
          className="cursor-pointer font-bold hover:underline"
          href={"/signin"}
        >
          Sign in to your account
        </Link>
      </p>
    </>
  );
}
