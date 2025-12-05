export interface QuestionOption {
  value: string;
  label: string;
}

export interface Question {
  id: string;
  section: string;
  question: string;
  type: "yes_no" | "yes_no_details" | "select" | "text" | "number";
  options?: QuestionOption[];
  detailsPrompt?: string;
  required?: boolean;
}

export const QUESTIONNAIRE_SECTIONS = [
  "General Health",
  "Recent Health",
  "Travel History",
  "Medical Conditions",
  "Infectious Diseases",
  "Blood & Transfusions",
  "Surgeries & Hospitalizations",
  "Medications & Vaccinations",
  "Tattoos & Piercings",
  "Lifestyle & Risk Factors",
];

export const HEALTH_QUESTIONS: Question[] = [
  // General Health (1-4)
  {
    id: "q1",
    section: "General Health",
    question: "Are you feeling well and healthy today?",
    type: "yes_no",
    required: true,
  },
  {
    id: "q2",
    section: "General Health",
    question: "Have you eaten and had enough fluids in the last 4 hours?",
    type: "yes_no",
    required: true,
  },
  {
    id: "q3",
    section: "General Health",
    question: "Have you had adequate sleep in the last 24 hours?",
    type: "yes_no",
  },
  {
    id: "q4",
    section: "General Health",
    question: "Are you currently taking any prescription medications?",
    type: "yes_no_details",
    detailsPrompt: "Please list all medications:",
  },

  // Recent Health (5-10)
  {
    id: "q5",
    section: "Recent Health",
    question: "In the past 7 days, have you had a fever, cold, flu, or any infection?",
    type: "yes_no_details",
    detailsPrompt: "Please describe:",
  },
  {
    id: "q6",
    section: "Recent Health",
    question: "In the past 7 days, have you had diarrhea or vomiting?",
    type: "yes_no",
  },
  {
    id: "q7",
    section: "Recent Health",
    question: "In the past 4 weeks, have you received any vaccinations?",
    type: "yes_no_details",
    detailsPrompt: "Which vaccines and when?",
  },
  {
    id: "q8",
    section: "Recent Health",
    question: "In the past 8 weeks, have you donated blood or plasma?",
    type: "yes_no",
  },
  {
    id: "q9",
    section: "Recent Health",
    question: "Have you had any dental work in the past 72 hours?",
    type: "yes_no",
  },
  {
    id: "q10",
    section: "Recent Health",
    question: "Are you currently pregnant or have you been pregnant in the last 6 weeks?",
    type: "yes_no",
  },

  // Travel History (11-14)
  {
    id: "q11",
    section: "Travel History",
    question: "In the past 12 months, have you traveled outside the United States?",
    type: "yes_no_details",
    detailsPrompt: "Which countries and when?",
  },
  {
    id: "q12",
    section: "Travel History",
    question: "Have you ever lived in or traveled to a malaria-risk area?",
    type: "yes_no_details",
    detailsPrompt: "Where and when?",
  },
  {
    id: "q13",
    section: "Travel History",
    question: "Have you traveled to an area with Zika virus in the past 6 months?",
    type: "yes_no",
  },
  {
    id: "q14",
    section: "Travel History",
    question: "Have you ever lived in or spent more than 5 years in Europe (1980-present)?",
    type: "yes_no_details",
    detailsPrompt: "Which countries and duration?",
  },

  // Medical Conditions (15-22)
  {
    id: "q15",
    section: "Medical Conditions",
    question: "Do you have or have you ever had heart disease or heart problems?",
    type: "yes_no_details",
    detailsPrompt: "Please describe:",
  },
  {
    id: "q16",
    section: "Medical Conditions",
    question: "Do you have or have you ever had lung disease (asthma, COPD, etc.)?",
    type: "yes_no_details",
    detailsPrompt: "Please describe:",
  },
  {
    id: "q17",
    section: "Medical Conditions",
    question: "Do you have diabetes?",
    type: "yes_no_details",
    detailsPrompt: "Type and how is it controlled?",
  },
  {
    id: "q18",
    section: "Medical Conditions",
    question: "Have you ever had cancer or a malignant tumor?",
    type: "yes_no_details",
    detailsPrompt: "Type of cancer and treatment:",
  },
  {
    id: "q19",
    section: "Medical Conditions",
    question: "Do you have any autoimmune diseases (lupus, rheumatoid arthritis, etc.)?",
    type: "yes_no_details",
    detailsPrompt: "Please describe:",
  },
  {
    id: "q20",
    section: "Medical Conditions",
    question: "Have you ever had a seizure or epilepsy?",
    type: "yes_no",
  },
  {
    id: "q21",
    section: "Medical Conditions",
    question: "Do you have any chronic illnesses not mentioned above?",
    type: "yes_no_details",
    detailsPrompt: "Please describe:",
  },
  {
    id: "q22",
    section: "Medical Conditions",
    question: "Have you ever been diagnosed with a genetic disorder?",
    type: "yes_no_details",
    detailsPrompt: "Please describe:",
  },

  // Infectious Diseases (23-28)
  {
    id: "q23",
    section: "Infectious Diseases",
    question: "Have you ever tested positive for HIV/AIDS?",
    type: "yes_no",
    required: true,
  },
  {
    id: "q24",
    section: "Infectious Diseases",
    question: "Have you ever had hepatitis B or hepatitis C?",
    type: "yes_no",
    required: true,
  },
  {
    id: "q25",
    section: "Infectious Diseases",
    question: "Have you ever had tuberculosis (TB) or been treated for TB?",
    type: "yes_no",
  },
  {
    id: "q26",
    section: "Infectious Diseases",
    question: "Have you ever had syphilis, gonorrhea, or chlamydia?",
    type: "yes_no_details",
    detailsPrompt: "When and was it treated?",
  },
  {
    id: "q27",
    section: "Infectious Diseases",
    question: "Have you ever had Chagas disease or leishmaniasis?",
    type: "yes_no",
  },
  {
    id: "q28",
    section: "Infectious Diseases",
    question: "In the past 12 months, have you had close contact with anyone with a serious infectious disease?",
    type: "yes_no_details",
    detailsPrompt: "Please describe:",
  },

  // Blood & Transfusions (29-31)
  {
    id: "q29",
    section: "Blood & Transfusions",
    question: "Have you ever received a blood transfusion?",
    type: "yes_no_details",
    detailsPrompt: "When and where?",
  },
  {
    id: "q30",
    section: "Blood & Transfusions",
    question: "Have you ever had a blood clotting disorder or bleeding problem?",
    type: "yes_no_details",
    detailsPrompt: "Please describe:",
  },
  {
    id: "q31",
    section: "Blood & Transfusions",
    question: "Have you ever received human-derived growth hormone, insulin from beef sources, or dura mater transplant?",
    type: "yes_no",
  },

  // Surgeries & Hospitalizations (32-33)
  {
    id: "q32",
    section: "Surgeries & Hospitalizations",
    question: "Have you had any surgeries in the past 12 months?",
    type: "yes_no_details",
    detailsPrompt: "What surgery and when?",
  },
  {
    id: "q33",
    section: "Surgeries & Hospitalizations",
    question: "Have you been hospitalized in the past 12 months?",
    type: "yes_no_details",
    detailsPrompt: "Reason and duration:",
  },

  // Medications & Vaccinations (34)
  {
    id: "q34",
    section: "Medications & Vaccinations",
    question: "Are you taking any blood thinners, aspirin, or anti-inflammatory medications?",
    type: "yes_no_details",
    detailsPrompt: "Please list:",
  },

  // Tattoos & Piercings (35-36)
  {
    id: "q35",
    section: "Tattoos & Piercings",
    question: "Have you gotten a tattoo in the past 12 months?",
    type: "yes_no_details",
    detailsPrompt: "When and where was it done?",
  },
  {
    id: "q36",
    section: "Tattoos & Piercings",
    question: "Have you gotten a body piercing in the past 12 months?",
    type: "yes_no",
  },

  // Lifestyle & Risk Factors (37-38)
  {
    id: "q37",
    section: "Lifestyle & Risk Factors",
    question: "Have you ever used intravenous drugs or shared needles?",
    type: "yes_no",
    required: true,
  },
  {
    id: "q38",
    section: "Lifestyle & Risk Factors",
    question: "Have you been incarcerated for more than 72 consecutive hours in the past 12 months?",
    type: "yes_no",
  },
];
