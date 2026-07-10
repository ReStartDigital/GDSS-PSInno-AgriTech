import { AuthUser, UserRole } from "@vegelink/shared";

export const roleLabels: Record<UserRole, string> = {
  farmer: "Farmer",
  buyer: "Buyer",
  transporter: "Transporter",
  agent: "Agent",
  admin: "Admin",
};

export function composeFullName(user: Partial<AuthUser> | null | undefined) {
  const fullNameFromParts = [
    user?.firstName?.trim(),
    user?.middleName?.trim(),
    user?.lastName?.trim(),
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullNameFromParts || user?.fullName?.trim() || "";
}

export function getFirstName(user: Partial<AuthUser> | null | undefined) {
  return user?.firstName?.trim() || composeFullName(user).split(" ")[0] || "";
}

export function getLastName(user: Partial<AuthUser> | null | undefined) {
  if (user?.lastName?.trim()) {
    return user.lastName.trim();
  }

  const parts = composeFullName(user).split(" ").filter(Boolean);
  return parts.length > 1 ? parts.slice(1).join(" ") : "";
}

export function mapProfileToAuthUser(profile: any, fallback?: Partial<AuthUser> | null): AuthUser {
  const user = profile?.user || profile;
  const firstName = user?.firstName ?? fallback?.firstName;
  const middleName = user?.middleName ?? fallback?.middleName ?? null;
  const lastName = user?.lastName ?? fallback?.lastName;
  const fullName = composeFullName({
    firstName,
    middleName,
    lastName,
    fullName: user?.fullName ?? fallback?.fullName,
  });

  return {
    id: user?.id ?? fallback?.id ?? "",
    phone: user?.phone ?? fallback?.phone ?? "",
    role: (user?.role ?? fallback?.role ?? "buyer") as UserRole,
    fullName,
    firstName,
    middleName,
    lastName,
    email: user?.email ?? fallback?.email ?? null,
    region: user?.region ?? fallback?.region ?? null,
    language: user?.language ?? fallback?.language ?? null,
  };
}
