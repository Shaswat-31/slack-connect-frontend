"use client";

import { getSession } from "next-auth/react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import Image from "next/image";

const SlackConnectPage = () => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    const session = await getSession();
    try {
      if (!session?.accessToken) {
        console.error("No access token found. User might not be logged in.");
        setLoading(false);
        return;
      }
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/slack/connect`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await res.json();
      window.location.href = data.redirectUrl;
      console.log("Slack connect response:", data);
    } catch (error) {
      console.error("Slack connect error:", error);
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-full h-full">
      <Card className="w-full max-w-lg border border-white/20 bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-6">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/communication.png"
              alt="Slack Logo"
              width={60}
              height={60}
              className="rounded-lg"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-[#611f69]">
            Let’s Connect Your Slack
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-gray-600">
            Connect your Slack workspace to start collaborating, scheduling
            messages, and automating your workflow — all from here.
          </p>
          <Button
            onClick={handleClick}
            disabled={loading}
            className="bg-[#611f69] hover:bg-[#4a155d] text-white text-lg px-6 py-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Image
                src="/communication.png"
                alt="Slack Icon"
                width={20}
                height={20}
                className="mr-2"
              />
            )}
            {loading ? "Connecting..." : "Connect to Slack"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SlackConnectPage;
