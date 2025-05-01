import React, { useState } from "react";
import GetStarted from "../GetStarted";
import QuestionsStep from "../QuestionsStep";
import { StepProvider } from "../../contexts";

const QuizContainer = () => {
  const [isStarted, setIsStarted] = useState(false);

  return (
    <StepProvider>
      <div>
        {isStarted ? (
          <QuestionsStep onBack={() => setIsStarted(false)} />
        ) : (
          <GetStarted onStart={() => setIsStarted(true)} />
        )}
      </div>
    </StepProvider>
  );
};

export default QuizContainer;
