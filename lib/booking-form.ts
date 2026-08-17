export type BookingField = "name" | "phone" | "consent" | "slot";

export function normalizePhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("8")) return `+7${digits.slice(1)}`;
  if (digits.length === 11 && digits.startsWith("7")) return `+${digits}`;
  if (digits.length === 10 && digits.startsWith("9")) return `+7${digits}`;
  return raw.trim();
}

export function isCompletePhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("9")) return true;
  return digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"));
}

export function validateBookingFields(input: {
  name: string;
  phone: string;
  consent: boolean;
  slotStart?: string | null;
}) {
  const errors: Partial<Record<BookingField, string>> = {};
  const name = input.name.trim();

  if (!name) errors.name = "Укажите имя";
  else if (name.length < 2) errors.name = "Имя слишком короткое";

  const phoneDigits = input.phone.replace(/\D/g, "");
  if (!phoneDigits) errors.phone = "Укажите телефон";
  else if (!isCompletePhone(input.phone)) {
    errors.phone = "Неполный номер. Введите все 11 цифр, например +7 908 129-41-16";
  }

  if (!input.consent) {
    errors.consent = "Нужно согласие на обработку персональных данных";
  }

  if (input.slotStart !== undefined) {
    const slotStart = new Date(input.slotStart || "");
    if (!input.slotStart || Number.isNaN(slotStart.getTime())) {
      errors.slot = "Выберите время";
    }
  }

  return errors;
}
