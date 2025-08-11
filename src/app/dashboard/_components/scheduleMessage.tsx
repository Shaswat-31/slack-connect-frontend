"use client";
import { getSession } from "next-auth/react";
import React, { useState } from "react";
interface ScheduleMessageFormProps {
  channel_Id: string;
}
const ScheduleMessageForm: React.FC<ScheduleMessageFormProps> = ({ channel_Id }) => {
  const [message, setMessage] = useState("");
  const [postAt, setPostAt] = useState(""); // ISO datetime string
  const [status, setStatus] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Scheduling message...");

    try {
         const session=await getSession();
              const slackAccessToken = session?.accessToken;
               if (!slackAccessToken) return;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/slack/schedule/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json",  Authorization: `Bearer ${slackAccessToken}`, },
        body: JSON.stringify({
          channelId:channel_Id,
          message,
          postAt, // send as ISO string or timestamp as your backend expects
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setStatus(`Error: ${errData.error || res.statusText}`);
        return;
      }

      setStatus("Message scheduled successfully!");
      setMessage("");
      setPostAt("");
    } catch (error) {
      setStatus("Error scheduling message.");
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-4 border rounded shadow">
      <div>
        <label htmlFor="channelId" className="block font-medium">Channel ID</label>
        <input
          id="channelId"
          type="text"
          value={channel_Id}
        //   onChange={(e) => setChannelId(e.target.value)}
          disabled
          className="mt-1 block w-full border rounded p-2"
        />
      </div>

      <div>
        <label htmlFor="message" className="block font-medium">Message</label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={4}
          className="mt-1 block w-full border rounded p-2"
        />
      </div>

      <div>
        <label htmlFor="postAt" className="block font-medium">Post At</label>
        <input
          id="postAt"
          type="datetime-local"
          value={postAt}
          onChange={(e) => setPostAt(e.target.value)}
          required
          className="mt-1 block w-full border rounded p-2"
        />
      </div>

      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Schedule Message
      </button>

      {status && <p className="mt-2 text-center">{status}</p>}
    </form>
  );
};

export default ScheduleMessageForm;
