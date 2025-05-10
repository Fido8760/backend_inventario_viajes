import { transport } from "../config/nodemailer"

type EmailType = {
    name: string,
    email: string,
    token: string
}

export class AuthEmail {
    static sendPasswordResetToken = async (user: EmailType) => {
        const email = await  transport.sendMail({
            from: 'CHECKLIST - VIAJES <admi@mudanzasamado.mx>',
            to: user.email,
            subject: 'APP CHECKLIST - Reestablece tu password',
            html: `
                <p>Hola: ${user.name}, has solicitado reestablecer tu password</p>
                <p>Visita el siguiente enlace</p>
                <a href="${process.env.FRONTEND_URL}/auth/new-password">Reestablecer Password</a>
                <p>Ingresa el siguiente código: <b>${user.token}</b></p>
            `
        })

        console.log('Mensaje enviado ', email.messageId)
    }
}

