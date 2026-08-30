function enabled(value: string | undefined, defaultValue = false) {
  if (value == null) return defaultValue;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

export const studentApiEnabled = enabled(process.env.NEXT_PUBLIC_SECONNECTA_STUDENT_ENABLED);
export const recommendationApiEnabled = enabled(process.env.NEXT_PUBLIC_SECONNECTA_RECOMMENDATIONS_ENABLED);
export const multichannelActivationEnabled = enabled(process.env.NEXT_PUBLIC_SECONNECTA_MULTICHANNEL_ACTIVATION_ENABLED);
