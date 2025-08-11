"use client";

import dynamic from "next/dynamic";

const SlackChannelPage = dynamic(() => import("./slackChannelPage"), {
  ssr: false,
});

const Page = () => {
  return (
    <div>
      <SlackChannelPage />
    </div>
  );
};

export default Page;