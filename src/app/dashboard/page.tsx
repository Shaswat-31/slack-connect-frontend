"use client";

import React, { useEffect, useState } from "react";
import { getSession, signIn, signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import SlackChannelPage from "./workspace/slackChannelPage";
import SlackConnectPage from "./_components/slackConnectPage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, LogOut } from "lucide-react";
import Image from "next/image";

const Dashboard = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    const redirected = searchParams.get("redirected");
    if (redirected === "true") {
      const email = localStorage.getItem("email");
      const password = localStorage.getItem("password");
      if (email && password) {
        signIn("credentials", { email, password, redirect: false }).then(() => {
          getSession().then((sess) => {
            setSession(sess);
            setLoading(false);
            window.location.href = "/dashboard";
          });
        });
      } else {
        setLoading(false);
      }
    } else {
      getSession().then((sess) => {
        setSession(sess);
        setLoading(false);
      });
    }
  }, [searchParams]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#611f69] via-[#3f46ad] to-[#02232d]">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
        <span className="ml-3 text-lg text-white font-medium">
          Loading session...
        </span>
      </div>
    );

  if (!session)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#611f69] via-[#3f46ad] to-[#02232d] p-6">
        <Card className="w-full max-w-md border border-white/20 bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-[#611f69]">
              Please log in
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600">
              You need to log in to access your dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
      if(session.user?.slackAccessToken){
    window.location.href="/dashboard/workspace"
  }
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#65468a] via-[#611f69] to-[#a762d2]">
      {/* Left Image Section */}
     {!session.user?.slackAccessToken && (
  <div className="relative hidden lg:block lg:w-1/3 h-screen overflow-hidden">
    <Image
      src="/social-media-concept.jpg"
      alt="Slack"
      fill
      className="object-cover object-top"
      priority
    />
    <div className="absolute inset-0 bg-black/30" />
    <div className="absolute bottom-10 left-10 text-white max-w-sm">
      <h2 className="text-4xl font-bold leading-tight">
        Cut Yourself Some Slack!
      </h2>
      <p className="mt-3 text-lg text-gray-200">
        Connect your Slack to stay in sync, share updates, and make work easier.
      </p>
    </div>
  </div>
)}

      {/* Right Dashboard Section */}
      <div className="flex flex-col flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-white text-3xl font-bold">
            Welcome, {session.user?.name || "User"}
          </h1>
          <Button
            variant="destructive"
            onClick={() => signOut()}
            className="flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            {/* Sign Out */}
          </Button>
        </div>

        {/* Content */}
        <div className="backdrop-blur-md border rounded-2xl h-full shadow-2xl flex justify-center items-center">
          <div className="p-6">
            {session.user?.slackAccessToken ? (
              // <SlackChannelPage />
              <div>
                ALready connected
              </div>
            ) : (
             <SlackConnectPage/>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
