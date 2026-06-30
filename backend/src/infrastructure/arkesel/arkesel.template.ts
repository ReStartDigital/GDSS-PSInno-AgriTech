export const ArkeselTemplates = {
  registrationOtp: (code: string) =>
    `VegeLink: Your verification code is ${code}. Valid for 10 minutes. Do not share this code with anyone.`,

  registrationOtpResent: (code: string) =>
    `VegeLink: Your new verification code is ${code}. Valid for 10 minutes.`,

  welcomeAfterPinSet: (name: string) => `VegeLink: Welcome ${name}! Your account is ready to use.`,
};