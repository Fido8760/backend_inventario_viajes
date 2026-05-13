"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthEmail = void 0;
const nodemailer_1 = require("../config/nodemailer");
class AuthEmail {
    static sendPasswordResetToken = async (user) => {
        const email = await nodemailer_1.transport.sendMail({
            from: 'CHECKLIST - VIAJES <admi@mudanzasamado.mx>',
            to: user.email,
            subject: 'APP CHECKLIST - Reestablece tu password',
            html: `
                <p>Hola: ${user.name}, has solicitado reestablecer tu password</p>
                <p>Visita el siguiente enlace</p>
                <a href="${process.env.FRONTEND_URL}/auth/new-password">Reestablecer Password</a>
                <p>Ingresa el siguiente código: <b>${user.token}</b></p>
            `
        });
        console.log('Mensaje enviado ', email.messageId);
    };
}
exports.AuthEmail = AuthEmail;
//# sourceMappingURL=AuthEmail.js.map