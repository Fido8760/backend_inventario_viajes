type EmailType = {
    name: string;
    email: string;
    token: string;
};
export declare class AuthEmail {
    static sendPasswordResetToken: (user: EmailType) => Promise<void>;
}
export {};
