export declare const questionType: {
    readonly YES_NO: "si_no";
    readonly OPTIONS: "opciones";
    readonly NUMBER: "numero";
    readonly TEXT: "texto";
};
export type QuestionType = typeof questionType[keyof typeof questionType];
