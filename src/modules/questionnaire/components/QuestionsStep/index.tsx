import React, { useEffect, useMemo, useState } from "react";
import expertsData from "@/common/static/expert.json";
import { useQuizStep } from "../../contexts";
import { Button } from "@/components/ui/button";
import { HiArrowLeft } from "react-icons/hi2";
import { useFormContext, useWatch } from "react-hook-form";
import { IQuizForm, IResult } from "../../interfaces";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";

type QuestionsStepProps = {
  onBack: () => void;
};

const QuestionsStep: React.FC<QuestionsStepProps> = ({ onBack }) => {
  const { step, setStep } = useQuizStep();
  const { control, reset, handleSubmit } = useFormContext<IQuizForm>();
  const values = useWatch({ control, name: `items` });
  const [result, setResult] = useState<IResult | null>(null);

  const stepData = useMemo(() => {
    return expertsData.find((_, i) => i === step - 1);
  }, [step]);

  const isLast = useMemo(() => {
    return step - 1 === expertsData.length - 1;
  }, [step]);

  const handleBack = () => {
    if (step === 1) {
      onBack();
      reset();
    } else {
      setStep((prev) => prev - 1);
    }
  };

  const submitHandler = async (values: IQuizForm) => {
    if (!isLast) {
      setStep((prev) => prev + 1);
      return;
    } else {
      try {
        const res = await fetch("/api/calculate", {
          body: JSON.stringify(values),
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const resJson = await res.json();
        setResult(resJson.data.reason);
      } catch (error) {
        console.log("🚀 ~ submitHandler ~ error:", error);
      }
    }
  };

  useEffect(() => {
    if (step !== 4) {
      setResult(null);
    }
  }, [step]);

  return (
    <form onSubmit={handleSubmit(submitHandler)}>
      <div className="flex items-center gap-4 mb-4">
        <Button onClick={handleBack} type="button">
          <HiArrowLeft />
        </Button>
        <p className="font-semibold">
          Pertanyaan ke {step} dari {expertsData.length}
        </p>
      </div>
      {stepData ? (
        <div>
          <div className="py-4">
            <FormField
              control={control}
              name={`items.${step - 1}.selected`}
              key={step}
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel className="mb-4">{stepData.question}</FormLabel>
                    <FormControl>
                      <RadioGroup
                        {...field}
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        {stepData.data.map((item) => {
                          return (
                            <div
                              key={item.label}
                              className="flex items-center space-x-2"
                            >
                              <RadioGroupItem
                                value={item.label}
                                id={item.label}
                              />
                              <Label htmlFor={item.label}>{item.label}</Label>
                            </div>
                          );
                        })}
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                );
              }}
            />
          </div>
          <div className="flex justify-end">
            <Button disabled={!values[step - 1]?.selected} type="submit">
              {isLast ? "Lihat Rekomendasi" : "Selanjutnya"}
            </Button>
          </div>
        </div>
      ) : null}

      {result ? (
        <div className="my-4 flex flex-col gap-4">
          <Card>
            <CardContent>
              <div dangerouslySetInnerHTML={{ __html: result.main }} />
            </CardContent>
          </Card>
          {result.others.map((res, i) => {
            return (
              <Card key={i}>
                <CardContent>
                  <div dangerouslySetInnerHTML={{ __html: res }} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}
    </form>
  );
};

export default QuestionsStep;
