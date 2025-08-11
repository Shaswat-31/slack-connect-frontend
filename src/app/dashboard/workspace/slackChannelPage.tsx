"use client";

import React, { useEffect, useState } from "react";
import { getSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Send, Clock, LogOut, User, Bot, StopCircle, Mic } from "lucide-react";
import Image from "next/image";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import useSpeechToText from 'react-hook-speech-to-text';
import { MdLightbulbOutline } from "react-icons/md";
import { toast } from "sonner";

type Channel = { id: string; name: string };
type Message = {
  id: string;
  messageText: string | null;
  createdAt: string;
  messageType: string;
  slackMessageId?: string | null;
  messageBy?:string|null;
  postAt?:string|null;
};

const SlackChannelPage = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [errors, setError] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [senderType,setSenderType]=useState("user");
  const [refetch,setRefetch]=useState(false);
  const[loading,setLoading]=useState(false);
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  const minValue = new Date(Date.now() + 2 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  if (value < minValue) {
    setScheduleDate(minValue);
  } else {
    setScheduleDate(value);
  }
};
  // Fetch channels
  useEffect(() => {
    const fetchChannels = async () => {
      setLoadingChannels(true);
      try {
        const session = await getSession();
        const slackAccessToken = session?.accessToken;
        if (!slackAccessToken) return;

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/slack/channels`, {
          headers: { Authorization: `Bearer ${slackAccessToken}` },
        });

        if (!res.ok) throw new Error("Failed to fetch channels");

        const data = await res.json();
        setChannels(data.channels || data);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoadingChannels(false);
      }
    };
    fetchChannels();
  }, []);

  const {
    error,
    interimResult,
    isRecording,
    results,
    startSpeechToText,
    stopSpeechToText,
  } = useSpeechToText({
    continuous: true,
    useLegacyResults: false
  });

  // Update message as results come in
  useEffect(() => {
    if (results.length > 0) {
      // Join all transcripts together
      const transcript = results
  .map((r) => (typeof r === "string" ? r : r.transcript))
  .join(" ");
      setMessage(transcript);
    }
  }, [results]);
  // Fetch messages when channel changes
  useEffect(() => {
    if (!selectedChannel) return;
    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const session = await getSession();
        if (!session) return;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/slack/messages/db/${selectedChannel}`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        if (!res.ok) throw new Error("Failed to fetch messages");
        const data = await res.json();
        setMessages(data.messages || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoadingMessages(false);
      }
    };
    fetchMessages();
  }, [selectedChannel,refetch]);

  const handleSendNow = async () => {
    try {
      setLoading(true);
      const session = await getSession();
      if (!session?.accessToken) return;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/slack/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ channelId: selectedChannel, text: message, userType:senderType }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      setMessage("");
      // Refresh messages
      setSelectedChannel(selectedChannel);
      toast.success("Message sent")
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    }finally{
      setRefetch(!refetch)
      setLoading(false);
    }
  };

const handleSchedule = async () => {
  try {
    if (!scheduleDate) {
      toast.error("Please select a schedule date and time.");
      return;
    }
    console.log(scheduleDate);
    const scheduledTime = new Date(scheduleDate).getTime();
    console.log(scheduledTime);
    const nowPlus2Min = Date.now() + 2 * 60 * 1000; // current time + 2 minutes in ms

    if (scheduledTime < nowPlus2Min) {
      toast.error("Scheduled time must be at least 2 minutes from now.");
      return;
    }

    setLoading(true);
    const session = await getSession();
    if (!session?.accessToken) {
      toast.error("Unauthorized. Please login again.");
      return;
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/slack/schedule/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({ channelId: selectedChannel, message, postAt: scheduleDate, userType: senderType }),
    });

    if (!res.ok) throw new Error("Failed to schedule message");

    setMessage("");
    setScheduleDate("");
    // Refresh messages
    setSelectedChannel(selectedChannel);
    toast.success("Message scheduled!");
  } catch (err: any) {
    toast.error(`Error: ${err.message}`);
  } finally {
    setRefetch(!refetch);
    setLoading(false);
  }
};

   const handleGenerate = async () => {
    if (!message.trim()) return;
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/slack/message/ai`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: message }),
        }
      );

      if (!res.ok) throw new Error("API request failed");

      const data = await res.json();

      // Assuming the API returns { generated: "some text" }
      if (data.generated) {
        setMessage(data.generated.content);
        toast.success("Message Improved!")
      } else {
        console.error("No generated content in response");
      }
    } catch (error) {
      console.error("Error calling AI API:", error);
      toast.error("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
    <div className="w-[300px] bg-gradient-to-b from-[#611f69] to-[#4a154b] text-white flex flex-col shadow-lg">
  {/* Header */}
  <div className="p-4 flex items-center justify-between border-b border-white/20">
    <h2 className="text-lg font-semibold tracking-wide">Channels</h2>
    <Button
      variant="ghost"
      size="sm"
      onClick={() => signOut()}
      className="text-white hover:bg-white/10 flex items-center gap-1 cursor-pointer"
    >
      <LogOut className="w-4 h-4" />
      {/* <span className="text-sm">Sign out</span> */}
    </Button>
  </div>

  {/* Channels List */}
  <ScrollArea className="flex-1">
    {loadingChannels ? (
      <div className="p-4 flex items-center text-white/80">
        <Loader2 className="animate-spin mr-2" /> Loading channels...
      </div>
    ) : channels.length > 0 ? (
      channels.map((ch) => (
        <Button
          key={ch.id}
          variant={selectedChannel === ch.id ? "secondary" : "ghost"}
          className={`w-full justify-start px-4 py-3 text-left rounded-none 
            transition-colors duration-150 cursor-pointer
            ${
              selectedChannel === ch.id
                ? "bg-white/15 text-white font-medium"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          onClick={() => setSelectedChannel(ch.id)}
        >
          #{ch.name}
        </Button>
      ))
    ) : (
      <div className="p-4 text-white/70 italic">No channels found</div>
    )}
  </ScrollArea>
</div>


      {/* Main Content */}
      <div className="flex-1 bg-gray-50 p-6 flex flex-col w-[800px]">
        {!selectedChannel ? (
          <div className="flex flex-col items-center justify-center flex-1 w-full h-full text-center">
      <div className="flex flex-col items-center justify-center w-full h-full">
        <div className="relative w-96 h-96 mb-6">
          <Image
            src="/19197385.jpg"
            alt="Slack illustration"
            fill
            className="object-contain object-center rounded-xl"
            priority
          />
        </div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">
          No channel selected
        </h2>
        <p className="text-gray-500 text-base max-w-md">
          Select a channel from the sidebar to view and send messages.
        </p>
      </div>
    </div>
        ) : (
          <>
            {/* Messages */}
            
           <ScrollArea className="flex-1 space-y-6 p-4 max-h-[800px]">
  {loadingMessages ? (
    <div className="flex justify-center items-center h-full text-gray-500">
      <Loader2 className="animate-spin mr-2" /> Loading messages...
    </div>
  ) : messages.length === 0 ? (
    <div className="flex flex-col items-center justify-center w-full h-full text-center py-10">
      <div className="relative w-48 h-48 mb-4">
        <Image
          src="/messages.png"
          alt="No messages illustration"
          fill
          className="object-contain object-center rounded-xl"
          priority
        />
      </div>
      <h3 className="text-lg font-semibold text-gray-700 mb-1">No messages yet</h3>
      <p className="text-gray-500 text-sm max-w-sm">
        Start the conversation by sending a new message to this channel.
      </p>
    </div>
  ) : (
    messages.map((msg) => {
      const isScheduled = msg.messageType === "scheduled";
      const isCancelled=msg.messageType==="canceled"
      const isFuture = new Date(msg.postAt || "") > new Date();
      
      const handleCancel = async () => {
        try {
          const session = await getSession();
      if (!session?.accessToken) return;
          await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/slack/schedule/deleteMessages`, {
            method: "Delete",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accessToken}`, },
            body: JSON.stringify({ messageId: msg.id }),
          });
          // Update locally to reflect canceled status
          setMessages((prev) =>
            prev.map((m) =>
              m.id === msg.id
                ? { ...m, messageType: "canceled" }
                : m
            )
          );
          toast.success("Message cancelled!")
        } catch (error) {
          console.error("Error canceling message:", error);
        }
      };

      return (
        <div
          key={msg.id}
          className={`flex items-start gap-3 ${
            isScheduled ? "opacity-80" : ""
          }`}
        >
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-md">
            {msg.messageBy?.[0]?.toUpperCase() || "U"}
          </div>

          {/* Message Bubble */}
          <div className="flex flex-col max-w-[75%]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800">
                {msg.messageBy || "You"}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(msg.createdAt).toLocaleString()}
              </span>
              {isScheduled && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                  Scheduled
                </span>
              )}
            </div>

            <div
  className={`px-4 py-2 rounded-2xl mt-1 shadow-sm ${
    isCancelled
      ? "bg-red-50 border border-red-200 text-red-700 line-through"
      : isScheduled
        ? "bg-yellow-50 border border-yellow-200 text-gray-700"
        : "bg-white border border-gray-200 text-gray-800"
  }`}
>
{msg.messageText}
{isScheduled && !isFuture && (
  <span className="ml-2 inline-block rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
    Sent
  </span>
)}
</div>

            {/* Cancel Button if scheduled & in future */}
           {isScheduled && isFuture && (
  <div className="flex items-center gap-4 mt-2">
    <button
      onClick={handleCancel}
      className="
        px-4 py-1 text-sm font-semibold
        bg-red-600 text-white rounded-full
        hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500
        transition
        cursor-pointer
        shadow-sm
      "
      aria-label="Cancel scheduled message"
    >
      Cancel
    </button>
    <time
      dateTime={msg.postAt || ""}
      className="text-gray-500 text-xs font-mono select-none"
    >
      {new Date(msg.postAt || "").toLocaleString()}
    </time>
  </div>
)}
          </div>
        </div>
      );
    })
  )}
</ScrollArea>



            {/* Message Input */}
            <div className="mt-4 flex flex-col gap-3 p-3 border-t border-gray-200 bg-white rounded-lg shadow-sm">
  {/* Row 1: Sender Type */}
 <div className="flex items-center gap-3">
  <label className="text-sm font-medium text-gray-700">Send as:</label>
  <Select value={senderType} onValueChange={setSenderType}>
    <SelectTrigger className="w-[160px] border-gray-300 focus:ring-2 focus:ring-purple-500 cursor-pointer">
      <SelectValue placeholder="Select sender" />
    </SelectTrigger>
    <SelectContent side="top" className="bg-white cursor-pointer">
      <SelectItem value="user">
        <div className="flex items-center gap-2 cursor-pointer">
          <User className="w-4 h-4 text-gray-600" /> User
        </div>
      </SelectItem>
      <SelectItem value="bot">
        <div className="flex items-center gap-2 cursor-pointer">
          <Bot className="w-4 h-4 text-gray-600" /> Bot
        </div>
      </SelectItem>
    </SelectContent>
  </Select>
   <button
      onClick={handleGenerate}
      disabled={loading || !message.trim()}
      aria-label="Improve sentence with AI"
      title="Improve sentence"
      className="p-2 rounded hover:bg-gray-200 cursor-pointer"
      type="button"
    >
      <MdLightbulbOutline size={24} color={loading ? "gray" : "orange"} />
    </button>
</div>

  {/* Row 2: Message Input & Actions */}
  <div className="flex gap-2">
     <Input
        placeholder={`Type your message as ${senderType}...`}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="flex-1"
      />

      {/* Mic button */}
      <button
        onClick={isRecording ? stopSpeechToText : startSpeechToText}
        className="flex items-center justify-center p-2 rounded-md bg-gray-200 hover:bg-gray-300"
        aria-label={isRecording ? "Stop recording" : "Start recording"}
        type="button"
      >
        {isRecording ? (
          <StopCircle className="w-6 h-6 text-red-600 cursor-pointer" />
        ) : (
          <Mic className="w-6 h-6 text-gray-700 cursor-pointer" />
        )}
      </button>

      {/* Visual indicator while recording */}
      {isRecording && (
        <span className="ml-1 text-red-600 font-semibold animate-pulse">
          Listening...
        </span>
      )}

    {/* Send Now Button */}
    <Button
      variant="default"
      onClick={handleSendNow}
      disabled={!message.trim() || loading}
      className="flex items-center gap-1 bg-[#611f69] cursor-pointer hover:bg-[#4a154b]"
    >
      <Send className="w-4 h-4" /> Send
    </Button>

    {/* Schedule Dialog */}
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-1 cursor-pointer">
          <Clock className="w-4 h-4" /> Schedule
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Message</DialogTitle>
          <DialogDescription>
            Pick a date and time to send your message automatically.
          </DialogDescription>
        </DialogHeader>
       <Input
  type="datetime-local"
  value={scheduleDate}
  onChange={handleDateChange}
  className="mt-2"
  min={new Date(Date.now() + 2 * 60 * 1000)
    .toISOString()
    .slice(0, 16)}
/>
        <Button
          className="mt-4 w-full bg-[#611f69] cursor-pointer"
          onClick={handleSchedule}
          disabled={!scheduleDate || !message.trim() || loading}
        >
          Schedule
        </Button>
      </DialogContent>
    </Dialog>
  </div>
</div>

          </>
        )}
      </div>
    </div>
  );
};

export default SlackChannelPage;
