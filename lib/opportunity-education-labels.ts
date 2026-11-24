export const educationLabels: Record<string, string> = {
  MIDDLE_SCHOOL: "Ensino Fundamental II",
  HIGH_SCHOOL: "Ensino Médio",
  FUNDAMENTAL_1: "Ensino Fundamental I",
  ...Object.fromEntries(Array.from({ length: 9 }, (_, index) => [
    `GRADE_${index + 1}`, `${index + 1}º ano do Ensino Fundamental`,
  ])),
  FUNDAMENTAL_2: "Ensino Fundamental II",
  ENSINO_MEDIO_1: "1º ano do Ensino Médio",
  ENSINO_MEDIO_2: "2º ano do Ensino Médio",
  ENSINO_MEDIO_3: "3º ano do Ensino Médio",
  GAP_YEAR: "Gap year",
  UNDERGRAD: "Universidade",
  UNDERGRADUATE: "Universidade",
  OTHER: "Outros",
};
