import nodemailer from "nodemailer";
import { SITE } from "@/lib/site";

function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export function canSendEmail() {
  return smtpConfigured();
}

function transporter() {
  const port = Number(process.env.SMTP_PORT || 465);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendMail(input: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  if (!smtpConfigured()) {
    if (process.env.NODE_ENV === "development") {
      console.info("[email:dev]", input.to, input.subject, "\n", input.text);
      return { ok: true as const, dev: true };
    }
    return { ok: false as const, error: "Почта ещё не настроена. Напишите в MAX или Telegram." };
  }

  const from =
    process.env.SMTP_FROM?.trim() ||
    `"${SITE.name}" <${process.env.SMTP_USER}>`;

  try {
    await transporter().sendMail({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    return { ok: true as const, dev: false };
  } catch (error) {
    console.error("[email]", error);
    return { ok: false as const, error: "Не удалось отправить письмо. Попробуйте ещё раз." };
  }
}

export async function sendLoginCodeEmail(email: string, code: string) {
  const text = [
    `Код входа в личный кабинет: ${code}`,
    "",
    "Код действует 10 минут. Если вы не запрашивали вход, просто проигнорируйте письмо.",
    "",
    SITE.name,
    SITE.url,
  ].join("\n");

  const html = `
    <p>Код входа в личный кабинет:</p>
    <p style="font-size:28px;letter-spacing:0.2em;font-weight:600">${code}</p>
    <p>Код действует 10 минут. Если вы не запрашивали вход, просто проигнорируйте письмо.</p>
    <p>${SITE.name}<br/>${SITE.url}</p>
  `;

  return sendMail({
    to: email,
    subject: `Код входа — ${SITE.name}`,
    text,
    html,
  });
}
