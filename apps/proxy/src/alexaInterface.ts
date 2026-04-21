
export interface AlexaIntentSlot {
  name: string;
  type: string;
}

export interface AlexaIntent {
  name: string;
  samples: string[];
  slots: AlexaIntentSlot[];
}

export interface AlexaLanguageModel {
  invocationName: string;
  modelConfiguration: {
    fallbackIntentSensitivity: {
      level: string;
    }
  },
  intents: AlexaIntent[];
  types: any[];
}

export interface AlexaInteractionModel {
  languageModel: AlexaLanguageModel;
}

export interface AlexaSkillModel {
  interactionModel: AlexaInteractionModel;
}
