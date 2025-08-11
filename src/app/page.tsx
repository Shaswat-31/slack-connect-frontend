"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MaterialInput } from "@/components/ui/material-input";
import Image from "next/image";
import { FaEye, FaEyeSlash } from "react-icons/fa";

// Zod schemas
const loginSchema = z.object({
  email: z.email().min(1,{ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const registerSchema = z
  .object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    email: z.email().min(1,{ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string().min(6, { message: "Confirm password must be at least 6 characters" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], // error goes to confirmPassword field
  });

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading,setLoading]=useState(false);
  const router = useRouter();

  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerRegister,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    localStorage.setItem("email", data.email);
    localStorage.setItem("password", data.password);

    const res = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (res?.ok) {
      router.push("/dashboard");
    } else {
      alert("Login failed");
      setLoading(false);
    }
  };

  const onRegisterSubmit = async (data: RegisterFormValues) => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        alert("Registration successful! You can now log in.");
        await onLoginSubmit({email:data.email, password:data.password});
        setIsLogin(true);
      } else {
        alert("Registration failed");
      }
    } catch (error) {
      console.error(error);
    }
    finally{
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#611f69] via-[#3f46ad] to-[#02232d]">
      {/* Left Image Section */}
      <div className="relative w-1/2 h-screen overflow-hidden">
        <Image
          src="/slack-image.jpg"
          alt="Slack"
          fill
          className="object-cover object-top"
          priority
        />
      </div>

      {/* Right Form Section */}
      <div className="flex w-1/2 items-center justify-center p-6 ">
        <Card className="w-full max-w-md flex flex-col border border-white/20 bg-white backdrop-blur-md rounded-2xl shadow-2xl p-6">
          <CardHeader>
            <CardTitle
              className="text-3xl font-bold text-center text-[#611f69]"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {isLogin ? "Sign In" : "Register"}
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col justify-center">
            {isLogin ? (
              <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-4">
                <div>
                <MaterialInput type="email" placeholder="Email" {...loginRegister("email")} />
                {loginErrors.email && (
                  <p className="text-red-400 text-[10px]">{loginErrors.email.message}</p>
                )}
                </div>
               <div>
  <div className="relative">
    <MaterialInput
      type={showLoginPassword ? "text" : "password"}
      placeholder="Password"
      {...loginRegister("password")}
    />
    <button
      type="button"
      className="absolute inset-y-0 right-3 flex items-center text-gray-500"
      onClick={() => setShowLoginPassword((prev) => !prev)}
    >
      {!showLoginPassword ? <FaEye /> : <FaEyeSlash />}
    </button>
  </div>
  {loginErrors.password && (
    <p className="text-red-400 text-[10px] mt-0.5">{loginErrors.password.message}</p>
  )}
</div>
                <Button type="submit" className="w-full bg-[#611f69] hover:bg-[#4b1751] text-white cursor-pointer" disabled={loading}>
                  {
                    loading? "Signing in..." : "Sign In"
                      }
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit(onRegisterSubmit)} className="space-y-4">
                <div>
                <MaterialInput type="text" placeholder="Your name" {...registerRegister("name")} />
                {registerErrors.name && (
                  <p className="text-red-400 text-[10px]">{registerErrors.name.message}</p>
                )}
                </div>
                <div>
                <MaterialInput type="email" placeholder="Email" {...registerRegister("email")} />
                {registerErrors.email && (
                  <p className="text-red-400 text-[10px]">{registerErrors.email.message}</p>
                )}
                </div>
                {/* Password with toggle */}
                <div>
                <div className="relative">
                  <MaterialInput
                    type={showRegisterPassword ? "text" : "password"}
                    placeholder="Password"
                    {...registerRegister("password")}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                    onClick={() => setShowRegisterPassword((prev) => !prev)}
                  >
                    {showRegisterPassword ? <FaEye /> : <FaEyeSlash />}
                  </button>
                </div>
                {registerErrors.password && (
                  <p className="text-red-400 text-[10px]">{registerErrors.password.message}</p>
                )}
</div>
                {/* Confirm Password */}
                <div>
                <div className="relative">
                  <MaterialInput
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    {...registerRegister("confirmPassword")}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
                  </button>
                </div>
                {registerErrors.confirmPassword && (
                  <p className="text-red-400 text-[10px]">{registerErrors.confirmPassword.message}</p>
                )}
              </div>
                <Button type="submit" className="w-full bg-[#611f69] hover:bg-[#4b1751] text-white cursor-pointer" disabled={loading}>
                  {
                    loading? "Registering...":"Register"
                  }
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex justify-center">
            <Button
              variant="link"
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-[#4b1751] hover:text-[#1b061e] transition-colors cursor-pointer"
            >
              {isLogin ? "New user? Register here" : "Already have an account? Sign in"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
