import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import { IQuizForm } from "../../interfaces";
import { Form } from "@/components/ui/form";
import expertsData from "@/common/static/expert.json";

type StepCtx = {
  step: number;
  setStep: Dispatch<SetStateAction<number>>;
};

export const StepContext = createContext<StepCtx>({
  step: 1,
  setStep: () => {},
});

type StepProviderProps = {
  children: React.ReactNode;
};

export const StepProvider: React.FC<StepProviderProps> = ({ children }) => {
  const [step, setStep] = useState(1);
  const formMethods = useForm<IQuizForm>({
    defaultValues: {
      items: expertsData.map((e) => ({
        id: e.id,
        selected: e.type === "single" ? [""] : [],
      })),
    },
  });

  return (
    <StepContext.Provider
      value={{
        step,
        setStep,
      }}
    >
      <Form {...formMethods}>{children}</Form>
    </StepContext.Provider>
  );
};

export const useQuizStep = () => useContext(StepContext);
