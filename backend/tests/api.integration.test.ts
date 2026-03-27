import request from "supertest";
import { app } from "../src/app";

type MemberResponse = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

async function createMember(payload?: Partial<MemberResponse>) {
  const res = await request(app).post("/api/members").send({
    firstName: payload?.firstName ?? "Jane",
    lastName: payload?.lastName ?? "Doe",
    email: payload?.email ?? `jane-${Date.now()}@example.com`,
  });

  return res;
}

describe("Fitness API integration", () => {
  it("returns 404 for unknown routes", async () => {
    const res = await request(app).get("/api/unknown-route");
    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe("Route not found");
    expect(res.body.error.code).toBe("ROUTE_NOT_FOUND");
  });

  it("returns health", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("lists seeded plans", async () => {
    const res = await request(app).get("/api/plans");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toMatchObject({ name: "Basic Monthly", priceCents: 3999 });
  });

  it("creates and searches members", async () => {
    const created = await createMember({ firstName: "John", lastName: "Smith" });
    expect(created.status).toBe(201);

    const search = await request(app).get("/api/members").query({ q: "john" });
    expect(search.status).toBe(200);
    expect(search.body).toHaveLength(1);
    expect(search.body[0]).toMatchObject({
      id: created.body.id,
      firstName: "John",
      lastName: "Smith",
    });
  });

  it("lists all members when query is empty", async () => {
    await createMember({ firstName: "Alice", email: "alice-list@example.com" });
    await createMember({ firstName: "Bob", email: "bob-list@example.com" });

    const res = await request(app).get("/api/members");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toMatchObject({ hasActiveMembership: false });
    expect(res.body[1]).toMatchObject({ hasActiveMembership: false });
  });

  it("includes hasActiveMembership true on list after assigning a plan", async () => {
    const memberRes = await createMember({ email: "active-flag@example.com" });
    const memberId = memberRes.body.id as string;
    const planId = (await request(app).get("/api/plans")).body[0].id as string;

    const before = await request(app).get("/api/members");
    const row = before.body.find((m: { id: string }) => m.id === memberId);
    expect(row?.hasActiveMembership).toBe(false);

    await request(app).post(`/api/members/${memberId}/memberships`).send({
      planId,
      startsAt: new Date(Date.now() - 60_000).toISOString(),
    });

    const after = await request(app).get("/api/members");
    const rowAfter = after.body.find((m: { id: string }) => m.id === memberId);
    expect(rowAfter?.hasActiveMembership).toBe(true);
  });

  it("searches members by partial email", async () => {
    await createMember({ email: "john.search@example.com" });

    const res = await request(app).get("/api/members").query({ q: "search@" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].email).toBe("john.search@example.com");
  });

  it("validates create member payload", async () => {
    const res = await request(app).post("/api/members").send({
      firstName: "",
      lastName: "Doe",
      email: "invalid-email",
    });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe("Validation error");
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(Array.isArray(res.body.error.details)).toBe(true);
  });

  it("prevents duplicate emails with 409", async () => {
    const email = "duplicate@example.com";
    const first = await createMember({ email });
    expect(first.status).toBe(201);

    const second = await createMember({ email });
    expect(second.status).toBe(409);
    expect(second.body.error.message).toBe("Unique constraint violation");
    expect(second.body.error.code).toBe("UNIQUE_CONSTRAINT_VIOLATION");
  });

  it("validates UUID params with 400", async () => {
    const res = await request(app).get("/api/members/not-a-uuid/summary");
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe("Validation error");
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 for summary when member does not exist", async () => {
    const res = await request(app).get("/api/members/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/summary");
    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe("Member not found");
    expect(res.body.error.code).toBe("MEMBER_NOT_FOUND");
  });

  it("returns empty summary when member has no membership/check-ins", async () => {
    const memberRes = await createMember();
    const memberId = memberRes.body.id as string;

    const summary = await request(app).get(`/api/members/${memberId}/summary`);
    expect(summary.status).toBe(200);
    expect(summary.body.activeMembership).toBeNull();
    expect(summary.body.lastCheckInAt).toBeNull();
    expect(summary.body.checkInsLast30Days).toBe(0);
  });

  it("assigns membership and allows check-in only when active", async () => {
    const memberRes = await createMember();
    const memberId = memberRes.body.id as string;

    const plansRes = await request(app).get("/api/plans");
    const planId = plansRes.body[0].id as string;

    const noMembershipCheckIn = await request(app).post(`/api/members/${memberId}/check-ins`);
    expect(noMembershipCheckIn.status).toBe(409);

    const assignRes = await request(app)
      .post(`/api/members/${memberId}/memberships`)
      .send({
        planId,
        startsAt: new Date(Date.now() - 60_000).toISOString(),
      });
    expect(assignRes.status).toBe(201);

    const checkIn = await request(app).post(`/api/members/${memberId}/check-ins`);
    expect(checkIn.status).toBe(201);
  });

  it("blocks overlapping active memberships", async () => {
    const memberRes = await createMember();
    const memberId = memberRes.body.id as string;
    const planId = (await request(app).get("/api/plans")).body[0].id as string;

    const startsAt = new Date(Date.now() - 60_000).toISOString();

    const first = await request(app).post(`/api/members/${memberId}/memberships`).send({
      planId,
      startsAt,
    });
    expect(first.status).toBe(201);

    const second = await request(app).post(`/api/members/${memberId}/memberships`).send({
      planId,
      startsAt,
    });
    expect(second.status).toBe(409);
  });

  it("cancels membership and then blocks check-ins", async () => {
    const memberRes = await createMember();
    const memberId = memberRes.body.id as string;
    const planId = (await request(app).get("/api/plans")).body[0].id as string;

    const membership = await request(app).post(`/api/members/${memberId}/memberships`).send({
      planId,
      startsAt: new Date(Date.now() - 60_000).toISOString(),
    });
    expect(membership.status).toBe(201);

    const cancel = await request(app)
      .post(`/api/members/${memberId}/memberships/${membership.body.id}/cancel`)
      .send({
        effectiveDate: new Date().toISOString(),
      });
    expect(cancel.status).toBe(200);

    const checkIn = await request(app).post(`/api/members/${memberId}/check-ins`);
    expect(checkIn.status).toBe(409);
  });

  it("returns 404 when cancelling unknown membership", async () => {
    const memberRes = await createMember();
    const memberId = memberRes.body.id as string;

    const res = await request(app)
      .post(`/api/members/${memberId}/memberships/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/cancel`)
      .send({ effectiveDate: new Date().toISOString() });

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe("Membership not found");
    expect(res.body.error.code).toBe("MEMBERSHIP_NOT_FOUND");
  });

  it("returns 409 when membership is already cancelled", async () => {
    const memberRes = await createMember();
    const memberId = memberRes.body.id as string;
    const planId = (await request(app).get("/api/plans")).body[0].id as string;

    const membership = await request(app).post(`/api/members/${memberId}/memberships`).send({
      planId,
      startsAt: new Date(Date.now() - 60_000).toISOString(),
    });

    const effectiveDate = new Date().toISOString();
    const firstCancel = await request(app)
      .post(`/api/members/${memberId}/memberships/${membership.body.id}/cancel`)
      .send({ effectiveDate });
    expect(firstCancel.status).toBe(200);

    const secondCancel = await request(app)
      .post(`/api/members/${memberId}/memberships/${membership.body.id}/cancel`)
      .send({ effectiveDate });
    expect(secondCancel.status).toBe(409);
    expect(secondCancel.body.error.message).toBe("Membership is already cancelled");
    expect(secondCancel.body.error.code).toBe("MEMBERSHIP_ALREADY_CANCELLED");
  });

  it("returns 400 when cancellation date is before membership start", async () => {
    const memberRes = await createMember();
    const memberId = memberRes.body.id as string;
    const planId = (await request(app).get("/api/plans")).body[0].id as string;

    const startDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const membership = await request(app).post(`/api/members/${memberId}/memberships`).send({
      planId,
      startsAt: startDate.toISOString(),
    });

    const invalidCancelDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const cancel = await request(app)
      .post(`/api/members/${memberId}/memberships/${membership.body.id}/cancel`)
      .send({ effectiveDate: invalidCancelDate });

    expect(cancel.status).toBe(400);
    expect(cancel.body.error.message).toBe("Cancellation effective date cannot be before start date");
    expect(cancel.body.error.code).toBe("INVALID_CANCELLATION_DATE");
  });

  it("prevents concurrent overlapping memberships", async () => {
    const memberRes = await createMember();
    const memberId = memberRes.body.id as string;
    const planId = (await request(app).get("/api/plans")).body[0].id as string;
    const startsAt = new Date(Date.now() - 60_000).toISOString();

    const [a, b] = await Promise.all([
      request(app).post(`/api/members/${memberId}/memberships`).send({ planId, startsAt }),
      request(app).post(`/api/members/${memberId}/memberships`).send({ planId, startsAt }),
    ]);

    const statuses = [a.status, b.status].sort((x, y) => x - y);
    expect(statuses).toEqual([201, 409]);
  });

  it("returns member summary with active plan and check-in metrics", async () => {
    const memberRes = await createMember();
    const memberId = memberRes.body.id as string;
    const plan = (await request(app).get("/api/plans")).body[0];

    await request(app).post(`/api/members/${memberId}/memberships`).send({
      planId: plan.id,
      startsAt: new Date(Date.now() - 60_000).toISOString(),
    });

    await request(app).post(`/api/members/${memberId}/check-ins`);
    await request(app).post(`/api/members/${memberId}/check-ins`);

    const summary = await request(app).get(`/api/members/${memberId}/summary`);
    expect(summary.status).toBe(200);
    expect(summary.body.activeMembership).toMatchObject({
      planId: plan.id,
      planName: "Basic Monthly",
    });
    expect(summary.body.lastCheckInAt).toBeTruthy();
    expect(summary.body.checkInsLast30Days).toBe(2);
  });
});
