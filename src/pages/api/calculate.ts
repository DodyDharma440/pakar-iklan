import { IQuizForm } from "@/modules/questionnaire/interfaces";
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

    let reason = "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (highResults.some((h) => h.platform === (userPreferred as any)?.id)) {
      reason = `${userPlatform} sudah cocok menjadi pilihan platform Anda!`;
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
