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

const prefixes: Record<string, string> = {
  "target-audiens": "Untuk target usia",
  anggaran: "Hal ini cocok untuk budget Anda yang berkisar di",
  tujuan: "Cocok dengan tujuan utama dari kampanye Anda yaitu untuk",
};

const handler = (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    // Mengambil input dari frontend
    const body = req.body as IQuizForm;

    // Mengambil value platfrom yang diinput oleh user
    // Platform dalam bentuk `label` dari array platform di experts data
    // Example: Instagram, Facebook, TikTok, etc.
    const userPlatform = body.items.find((i) => i.id === "platform")?.selected;

    // Mengambil data lengkap dari plaform yang dipilih user
    const userPreferred = expertsData[0].data.find((p) =>
      userPlatform?.includes(p.label)
    );

    // Inisiasi array untuk menampung apa saja platform yang cocok dari jawaban yang dikirim user
    let platformResults: Array<{ name: string; score: number }> = [];

    // Looping inputan dari frontend untuk mengisi array `platformResults`
    body.items.forEach((item) => {
      // Mengambil index untuk array experts data
      const index = expertsData.findIndex((e) => e.id === item.id);

      // Mengambil lengkap jawaban dari pertanyaan yang diisi user
      // Jawaban akan selalu berupa array karena ada pertanyaan yang bisa jawaban ganda
      // Example value:
      // [
      //   {
      //     "label": "<1 juta",
      //     "platform": [
      //       { "name": "instagram", "score": 1 },
      //       { "name": "tiktok", "score": 1 }
      //     ],
      //     "result": "Gunakan metode organik dan kolaborasi dengan micro-influencer."
      //   }
      // ]
      const answer = expertsData[index].data.filter((d) =>
        item.selected.includes(d.label)
      );

      // Melakukan pengecekan apakah ada data jawaban
      if (answer.length && answer.some((a) => a.platform?.length)) {
        // Pengumpulan data platform per item jawaban
        let answerPlatforms: (typeof answer)[number]["platform"] = [];
        answer.forEach((a) => {
          answerPlatforms = [...answerPlatforms, ...a.platform];
        });

        // Penggabungan data platform dari masing-masing jawaban ke array utama agar menjadi satu
        platformResults = [...platformResults, ...answerPlatforms];
      }
    });

    // Grouping hasil jawaban user dari array `plarformResults`
    // Hasil grouping ini menentukan berapa skor yang didapat untuk masing-masing platform
    // Example value:
    // {
    //   "instagram": 4,
    //   "tiktok": 2,
    // }
    const result = platformResults.reduce(
      (acc: Record<string, number>, platform) => {
        if (!acc[platform.name]) acc[platform.name] = 0;
        acc[platform.name] += platform.score;
        return acc;
      },
      {}
    );

    // Mencari skor tertinggi dari semua platform yang skornya sudah diakumulasi
    const highestScore = Math.max(...Object.values(result));

    // Melakukan filter yang dimana platform dengan skor paling tinggi saja yang ditampilkan
    // Example value:
    // [
    //   {
    //     platform: "instagram",
    //     score: 4,
    //   },
    //   {
    //     platform: "facebook",
    //     score: 4,
    //   },
    // ];
    const highResults = Object.entries(result)
      .map(([key, value]) => ({
        platform: key,
        score: value,
      }))
      .filter((r) => r.score === highestScore);

    // Inisiasi variable reason
    // Disini akan berisi deskripsi apakah platformnya cocok
    // Jika platform tidak cocok maka akan ada alasannya mengapa
    // Property `main` berisi deskripsi utama
    // Dan property `others` yang berupa array akan berisi penjelasan tambahan
    const reason: IResult = {
      main: "",
      others: [],
    };

    // Berupa function untuk menghandle saran-saran apa yang dapat dilakukan berdasarkan jawaban dari user
    // Jadi saran ini diluar skor yang didapat
    // Saran disini hanya bergantung pada jawaban user
    const handleTodo = () => {
      let suggestion = `Berdasarkan jawaban yang Anda isi, berikut adalah saran yang dapat dilakukan. <br /> <ul class="list-disc pl-4">`;

      // Melakukan looping per item pertanyaan
      body.items.forEach((item) => {
        // Pengecualian untuk jawaban platform preferensi user
        if (item.id !== "platform") {
          item.selected.forEach((selected) => {
            // Mengambil data jawaban lengkap ke expert data berdasarkan jawaban yang dipilih
            const res = getAnswerResult(selected, item.id);
            suggestion += `<li>${res} ${
              prefixes[item.id]
            } <b>${selected}</b></li>`;
          });
        }
      });
      reason.others.push(`<div>${suggestion}</ul></div>`);
    };

    // Mengambil apakah preferensi user ada pada platform dengan skor tertinggi
    const userHighResult = highResults.find(
      (h) => h.platform === (userPreferred as any)?.id
    );

    reason.main = `${userPlatform} <b>${
      // Jika platform yang dipilih user ada pada array platform dengan skor tertinggi,
      // maka diberikan pernyataan bahwa platform pilihan user sudah cocok
      userHighResult ? "sudah" : "belum"
    } cocok</b> menjadi pilihan platform Anda${
      userHighResult
        ? "!"
        : ` karena ${userPlatform} akan cocok pada poin-poin dibawah ini. <ul class="list-disc pl-4">`
    }`;

    if (userHighResult) {
      // Jika platform user dan platform skor tertinggi cocok

      // Mengambil data lengkap platform dari expert data
      const platformRes = getPlatformResult(userHighResult.platform);

      // Menambahkan apa yang harus dilakukan untuk platform tersebut ke deskripsi utama
      reason.main += ` ${platformRes?.result}`;

      // Menambahkan details campaign berdasarkan platform
      const details = (platformRes as any).details
        .map((d: string) => `<li>${d}</li>`)
        .join("");
      reason.main = `<div>${reason.main} Berikut ini adalah jenis-jenis penayangan iklan yang dapat dilakukan. <ul class="list-disc pl-4"> ${details} </ul></div>`;

      // Pemanggilan function untuk menghandle saran berdasarkan jawaban user
      handleTodo();
    } else {
      // Jika platform user dan platform skor tertinggi tidak cocok

      const prefixes: Record<string, string> = {
        "target-audiens": "Target audiens",
        anggaran: "Anggaran berkisar",
        tujuan: "Memiliki tujuan untuk",
      };

      expertsData.slice(1).forEach((data) => {
        // Mencari data jawaban yang platformnya sesuai dengan pilihan user
        const withPlatform = data.data
          .filter((d) =>
            d.platform.some((p) => p.name === (userPreferred as any)?.id)
          )
          .map((p) => ({
            ...p,
            // Penambahan property `isChecked` yang menandakan bahwa platform jawaban sudah sesuai dengan platform pilihan user
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
      // Memberikan saran ketika ada lebih dari 1 skor tertinggi atau platform user tidak sesuai dengan rekomendasi
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
          // Menampilkan data details
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
      // Ketika platform preferensi user tidak ada pada skor tertinggi, maka fungsi untuk saran dari jawaban ditaruh dibawah
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
