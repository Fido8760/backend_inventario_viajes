export const questionType = {
    YES_NO: 'si_no',
    OPTIONS: 'opciones',
    NUMBER: 'numero',
    TEXT: 'texto'
} as const;

export type QuestionType = typeof questionType[keyof typeof questionType];