import { IQuizForm, IResult } from "@/modules/questionnaire/interfaces";
import { NextApiRequest, NextApiResponse } from "next";
import expertsData from "@/common/static/expert.json";

const addAnd = (value: string, word: string = "dan") => {
  const splitted = value.split(",");
  if (splitted.length > 1) {
    const lastWord = splitted[splitted.length - 1];
    splitted[splitted.length - 1] = `${word} ${lastWord}`;
    return splitted.join(", ");
  }
  return value;
};

const getPlatformResult = (platform: string) => {
  return expertsData[0].data.find((d) => (d as any).id === platform);
};

const getAnswerResult = (answer: string, id: string, platform?: string) => {
  const expertData = expertsData.find((e) => e.id === id);

  const result =
    expertData?.data.find((d) => {
      return answer === d.label && !platform
        ? true
        : d.platform.some((p) => p.name === platform);
    })?.result ?? "";

  return result;
};

const handler = (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const body = req.body as IQuizForm;
    const userPlatform = body.items.find((i) => i.id === "platform")?.selected;
    const userPreferred = expertsData[0].data.find((p) =>
      userPlatform?.includes(p.label)
    );
    let platformResults: Array<{ name: string; score: number }> = [];

    body.items.forEach((item) => {
      const index = expertsData.findIndex((e) => e.id === item.id);
      const answer = expertsData[index].data.filter((d) =>
        item.selected.includes(d.label)
      );

      if (answer.length && answer.some((a) => a.platform?.length)) {
        let answerPlatforms: (typeof answer)[number]["platform"] = [];
        answer.forEach((a) => {
          answerPlatforms = [...answerPlatforms, ...a.platform];
        });
        platformResults = [...platformResults, ...answerPlatforms];
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

    const prefixes: Record<string, string> = {
      "target-audiens": "Untuk target usia",
      anggaran: "Hal ini cocok untuk budget Anda yang berkisar di",
      tujuan: "Cocok dengan tujuan utama dari kampanye Anda yaitu untuk",
    };

    const handleTodo = () => {
      let suggestion = `Berdasarkan jawaban yang Anda isi, berikut adalah saran yang dapat dilakukan. <br /> <ul class="list-disc pl-4">`;
      body.items.forEach((item) => {
        if (item.id !== "platform") {
          item.selected.forEach((selected) => {
            const res = getAnswerResult(selected, item.id);
            suggestion += `<li>${res} ${
              prefixes[item.id]
            } <b>${selected}</b></li>`;
          });
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
    } cocok</b> menjadi pilihan platform Anda${
      userHighResult
        ? "!"
        : ` karena ${userPlatform} akan cocok pada poin-poin dibawah ini. <ul class="list-disc pl-4">`
    }`;

    if (userHighResult) {
      const platformRes = getPlatformResult(userHighResult.platform);
      reason.main += ` ${platformRes?.result}`;
      const details = (platformRes as any).details
        .map((d: string) => `<li>${d}</li>`)
        .join("");
      reason.main = `<div>${reason.main} Berikut ini adalah jenis-jenis penayangan iklan yang dapat dilakukan. <ul class="list-disc pl-4"> ${details} </ul></div>`;
      handleTodo();
    } else {
      const prefixes: Record<string, string> = {
        "target-audiens": "Target audiens",
        anggaran: "Anggaran berkisar",
        tujuan: "Memiliki tujuan untuk",
      };

      expertsData.slice(1).forEach((data) => {
        const withPlatform = data.data
          .filter((d) =>
            d.platform.some((p) => p.name === (userPreferred as any)?.id)
          )
          .map((p) => ({
            ...p,
            isChecked: body.items.some((i) => i.selected.includes(p.label)),
          }));

        if (withPlatform.length) {
          const isMatch = withPlatform.some((p) => p.isChecked);
          reason.main += `<li>${prefixes[data.id]} ${
            withPlatform.length
              ? `${addAnd(
                  withPlatform.map((p) => p.label).join(", "),
                  "atau"
                )} <span class="font-bold ${
                  isMatch ? "text-green-500" : "text-red-500"
                }">(${isMatch ? "Sudah Sesuai" : "Belum Sesuai"})</span>`
              : ""
          } </li>`;
        }
      });
      reason.main += "</ul>";
    }

    if ((highResults.length > 1 && userHighResult) || !userHighResult) {
      let suggestion = `${
        userHighResult
          ? `Selain ${userPlatform}, Anda bisa menggunakan platform ini.`
          : "Platform yang disarankan adalah: "
      } <br /> <ol class="list-decimal pl-4">`;

      const handleSuggest = (h: (typeof highResults)[number]) => {
        const platformLabel =
          expertsData[0].data.find((p) => (p as any).id === h.platform)
            ?.label ?? h.platform;
        if (h.platform !== userHighResult?.platform) {
          let _reason = `${platformLabel} - `;
          const platformRes = getPlatformResult(h.platform);
          const details = (platformRes as any).details
            .map((d: string) => `<li>${d}</li>`)
            .join("");
          _reason += ` ${platformRes?.result} Jenis-jenis penayangan iklan yang dapat dilakukan adalah: <ul class="list-disc pl-4">${details}</ul>`;
          suggestion += `<li>${_reason}</li>`;
        }
      };

      highResults.forEach(handleSuggest);
      reason.others.push(suggestion);
    }

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
