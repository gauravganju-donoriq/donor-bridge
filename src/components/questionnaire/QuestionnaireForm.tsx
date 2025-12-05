import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { HEALTH_QUESTIONS, QUESTIONNAIRE_SECTIONS, type Question } from "@/data/healthQuestionnaireQuestions";

interface QuestionnaireFormProps {
  initialResponses?: Record<string, any>;
  onSave: (responses: Record<string, any>, isComplete: boolean) => Promise<void>;
  readOnly?: boolean;
}

const QuestionnaireForm = ({ initialResponses = {}, onSave, readOnly = false }: QuestionnaireFormProps) => {
  const [responses, setResponses] = useState<Record<string, any>>(initialResponses);
  const [currentSection, setCurrentSection] = useState(0);
  const [saving, setSaving] = useState(false);

  // Get questions for current section
  const currentSectionName = QUESTIONNAIRE_SECTIONS[currentSection];
  const sectionQuestions = HEALTH_QUESTIONS.filter(q => q.section === currentSectionName);

  // Calculate progress
  const answeredQuestions = HEALTH_QUESTIONS.filter(q => responses[q.id]?.answer !== undefined).length;
  const progress = (answeredQuestions / HEALTH_QUESTIONS.length) * 100;

  // Check if all required questions are answered
  const requiredQuestions = HEALTH_QUESTIONS.filter(q => q.required);
  const allRequiredAnswered = requiredQuestions.every(q => responses[q.id]?.answer !== undefined);

  const handleAnswer = (questionId: string, answer: boolean) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], answer }
    }));
  };

  const handleDetails = (questionId: string, details: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], details }
    }));
  };

  const handleSave = async (isComplete: boolean) => {
    setSaving(true);
    try {
      await onSave(responses, isComplete);
    } finally {
      setSaving(false);
    }
  };

  const goToNextSection = () => {
    if (currentSection < QUESTIONNAIRE_SECTIONS.length - 1) {
      setCurrentSection(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const goToPrevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur z-10 pb-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {answeredQuestions} of {HEALTH_QUESTIONS.length} questions answered
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round(progress)}% complete
          </span>
        </div>
        <Progress value={progress} className="h-2" />
        
        {/* Section Navigation */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2">
          {QUESTIONNAIRE_SECTIONS.map((section, idx) => {
            const sectionQs = HEALTH_QUESTIONS.filter(q => q.section === section);
            const sectionAnswered = sectionQs.filter(q => responses[q.id]?.answer !== undefined).length;
            const isComplete = sectionAnswered === sectionQs.length;
            
            return (
              <Button
                key={section}
                variant={currentSection === idx ? "default" : "outline"}
                size="sm"
                className={cn(
                  "whitespace-nowrap text-xs",
                  isComplete && currentSection !== idx && "bg-green-500/10 border-green-500/50"
                )}
                onClick={() => setCurrentSection(idx)}
              >
                {section}
                {isComplete && currentSection !== idx && (
                  <CheckCircle2 className="h-3 w-3 ml-1 text-green-600" />
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Current Section Questions */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">{currentSectionName}</h2>
        
        {sectionQuestions.map((question, idx) => (
          <QuestionCard
            key={question.id}
            question={question}
            questionNumber={HEALTH_QUESTIONS.findIndex(q => q.id === question.id) + 1}
            response={responses[question.id]}
            onAnswer={(answer) => handleAnswer(question.id, answer)}
            onDetails={(details) => handleDetails(question.id, details)}
            readOnly={readOnly}
          />
        ))}
      </div>

      {/* Navigation & Actions */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur pt-4 border-t flex items-center justify-between">
        <Button
          variant="outline"
          onClick={goToPrevSection}
          disabled={currentSection === 0}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          {!readOnly && (
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={saving}
            >
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Save Progress
            </Button>
          )}

          {currentSection === QUESTIONNAIRE_SECTIONS.length - 1 ? (
            !readOnly && (
              <Button
                onClick={() => handleSave(true)}
                disabled={saving || !allRequiredAnswered}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Complete Questionnaire
              </Button>
            )
          ) : (
            <Button onClick={goToNextSection} className="gap-1">
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  response?: { answer?: boolean; details?: string };
  onAnswer: (answer: boolean) => void;
  onDetails: (details: string) => void;
  readOnly?: boolean;
}

const QuestionCard = ({ question, questionNumber, response, onAnswer, onDetails, readOnly }: QuestionCardProps) => {
  const showDetails = question.type === "yes_no_details" && response?.answer === true;

  return (
    <div className="p-4 md:p-6 border rounded-xl bg-card space-y-4">
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
          {questionNumber}
        </span>
        <div className="flex-1">
          <p className="text-base md:text-lg font-medium">
            {question.question}
            {question.required && <span className="text-destructive ml-1">*</span>}
          </p>
        </div>
      </div>

      {/* Yes/No Buttons - Large touch targets for iPad */}
      <div className="flex gap-3 pl-11">
        <Button
          type="button"
          variant={response?.answer === true ? "default" : "outline"}
          className={cn(
            "flex-1 h-14 text-lg font-medium",
            response?.answer === true && "bg-red-500 hover:bg-red-600 border-red-500"
          )}
          onClick={() => !readOnly && onAnswer(true)}
          disabled={readOnly}
        >
          <XCircle className="h-5 w-5 mr-2" />
          Yes
        </Button>
        <Button
          type="button"
          variant={response?.answer === false ? "default" : "outline"}
          className={cn(
            "flex-1 h-14 text-lg font-medium",
            response?.answer === false && "bg-green-500 hover:bg-green-600 border-green-500"
          )}
          onClick={() => !readOnly && onAnswer(false)}
          disabled={readOnly}
        >
          <CheckCircle2 className="h-5 w-5 mr-2" />
          No
        </Button>
      </div>

      {/* Details input for yes_no_details type */}
      {showDetails && (
        <div className="pl-11 space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            {question.detailsPrompt || "Please provide details:"}
          </label>
          <Textarea
            value={response?.details || ""}
            onChange={(e) => onDetails(e.target.value)}
            placeholder="Enter details here..."
            className="min-h-[80px] text-base"
            disabled={readOnly}
          />
        </div>
      )}
    </div>
  );
};

export default QuestionnaireForm;
