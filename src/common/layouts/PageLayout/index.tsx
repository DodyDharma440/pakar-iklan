import React from "react";

type PageLayoutProps = {
  children: React.ReactNode;
};

const PageLayout: React.FC<PageLayoutProps> = ({ children }) => {
  return (
    <main className="max-w-lg mx-auto border-x border-gray-200 dark:border-zinc-700 min-h-screen">
      <nav className="fixed top-0 inset-x-0 max-w-[510px] mx-auto border-b border-zinc-700 p-4 flex items-center justify-center bg-black/30 backdrop-blur-md">
        <h1 className="font-bold text-2xl">Pakar Iklan</h1>
      </nav>
      <div className="pt-[65px]">
        <div className="p-4">{children}</div>
      </div>
    </main>
  );
};

export default PageLayout;
