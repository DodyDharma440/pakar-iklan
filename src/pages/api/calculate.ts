import { IQuizForm, IResult } from "@/modules/questionnaire/interfaces";
import { NextApiRequest, NextApiResponse } from "next";
import expertsData from "@/common/static/expert.json";

const handler = (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const body = req.body as IQuizForm;
    const userPlatform = body.items.find((i) => i.id === "platform")?.selected;
    const userPreferred = expertsData[0].data.find(
      (p) => p.label === userPlatform
    );
    let platformResults: Array<{ name: string; score: number }> = [];

    body.items.forEach((item) => {
      const index = expertsData.findIndex((e) => e.id === item.id);
      const answer = expertsData[index].data.find(
        (d) => d.label === item.selected
      );
      if (answer && Object.hasOwn(answer, "platform")) {
        platformResults = [...platformResults, ...answer.platform];
      }
    });

    const result = platformResults.reduce(
      (acc: Record<string, number>, platform) => {
        if (!acc[platform.name]) acc[platform.name] = 0;
        acc[platform.name] += platform.score;
        return acc;
      },
      {}
    );

    const highestScore = Math.max(...Object.values(result));
    const highResults = Object.entries(result)
      .map(([key, value]) => ({
        platform: key,
        score: value,
      }))
      .filter((r) => r.score === highestScore);

    const getPlatformResult = (platform: string) => {
      return expertsData[0].data.find((d) => (d as any).id === platform);
    };

    const getAnswerResult = (answer: string, id: string, platform?: string) => {
      const expertData = expertsData.find((e) => e.id === id);
      return (
        expertData?.data.find((d) => {
          return d.label === answer && !platform
            ? true
            : d.platform.some((p) => p.name === platform);
        })?.result ?? ""
      );
    };

    const handleTodo = () => {
      let suggestion = `Berdasarkan jawaban yang Anda isi, berikut adalah saran yang dapat dilakukan. <br /> <ul style="list-style: inside;">`;
      body.items.forEach((item) => {
        if (item.id !== "platform") {
          const res = getAnswerResult(item.selected, item.id);
          suggestion += `<li>${res} (${item.selected})</li>`;
        }
      });
      reason.others.push(`<div>${suggestion}</ul></div>`);
    };

    const reason: IResult = {
      main: "",
      others: [],
    };

    const userHighResult = highResults.find(
      (h) => h.platform === (userPreferred as any)?.id
    );
    reason.main = `${userPlatform} <b>${
      userHighResult ? "sudah" : "belum"
    } cocok</b> menjadi pilihan platform Anda!`;

    if (userHighResult) {
      const platformRes = getPlatformResult(userHighResult.platform);
      reason.main += ` ${platformRes?.result}`;
      reason.main = `<p>${reason.main}</p>`;
      handleTodo();
    }

    let suggestion = `${
      userHighResult
        ? `Selain ${userPlatform}, Anda bisa menggunakan platform ini.`
        : "Platform yang disarankan adalah: "
    } <br /> <ul style="list-style: inside;">`;
    const handleSuggest = (h: (typeof highResults)[number]) => {
      const platformLabel =
        expertsData[0].data.find((p) => (p as any).id === h.platform)?.label ??
        h.platform;
      if (h.platform !== userHighResult?.platform) {
        let _reason = `${platformLabel} - `;
        const platformRes = getPlatformResult(h.platform);
        _reason += ` ${platformRes?.result}`;
        suggestion += `<li>${_reason}</li>`;
      }
    };

    highResults.forEach(handleSuggest);
    reason.others.push(suggestion);

    if (!userHighResult) {
      handleTodo();
    }

    res.json({
      data: {
        userPreferred: userPlatform,
        recommendedPlatforms: result,
        highResults,
        reason,
      },
    });
  }
};

export default handler;
