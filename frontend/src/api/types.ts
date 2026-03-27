export type Member = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  hasActiveMembership?: boolean;
};

export type Plan = {
  id: string;
  name: string;
  priceCents: number;
  createdAt: string;
  updatedAt: string;
};

export type MemberSummary = {
  memberId: string;
  activeMembership: {
    membershipId: string;
    planId: string;
    planName: string;
    startsAt: string;
    cancelledAt: string | null;
  } | null;
  lastCheckInAt: string | null;
  checkInsLast30Days: number;
};

export type Membership = {
  id: string;
  memberId: string;
  planId: string;
  startsAt: string;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CheckIn = {
  id: string;
  memberId: string;
  createdAt: string;
};

export type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};
