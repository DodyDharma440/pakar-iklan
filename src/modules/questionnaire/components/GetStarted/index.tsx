import { Button } from "@/components/ui/button";
import React from "react";

type GetStartedProps = {
  onStart: () => void;
};

const GetStarted: React.FC<GetStartedProps> = ({ onStart }) => {
  return (
    <div className="text-center max-w-sm mx-auto min-h-[300px] flex flex-col items-center justify-center">
      <h2 className="font-bold text-xl mb-2">
        Selamat Datang di PakarIklan — Sistem Pakar Strategi Kampanye Iklan Anda
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Jawab beberapa pertanyaan singkat seputar tujuan, anggaran, target
        audiens, dan preferensi platform. Sistem akan memberikan rekomendasi
        untuk Anda.
      </p>

      <Button size="lg" onClick={onStart}>
        Mulai Sekarang
      </Button>
    </div>
  );
};

export default GetStarted;
