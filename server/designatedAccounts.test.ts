import { it, expect, vi } from "vitest";
import { createHash } from "node:crypto";
import { designation,approveMailbox } from "./designatedAccounts";
import * as db from "./db";
it("binds a designated role only to the email proven by the provider",async()=>{
  const email="member@example.org";
  const identity={openId:"ghop:test",email,loginMethod:"otp:"+createHash("sha256").update(email).digest("hex").slice(0,48)};
  expect(designation(identity)).toBeUndefined();
  const save=vi.spyOn(db,"upsertUser");
  await approveMailbox(email,{email,id:"550e8400-e29b-41d4-a716-446655440000"});
  expect(save).not.toHaveBeenCalled();
  save.mockRestore();
});
