const nodemailer = require("nodemailer");

async function mandarEmail() {
    // cria conta automaticamente sem precisar de cadastro manual

    return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: process.env.ETHEREAL_USER,
            pass: process.env.ETHEREAL_PASS,
        },
    });
}

module.exports = {
    mandarEmail
};