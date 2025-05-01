import { QuizContainer } from "@/modules/questionnaire/components";
import Head from "next/head";
import React from "react";

const HomePage = () => {
  return (
    <>
      <Head>
        <title>Pakar Iklan</title>
      </Head>

      <QuizContainer />
    </>
  );
};

export default HomePage;
