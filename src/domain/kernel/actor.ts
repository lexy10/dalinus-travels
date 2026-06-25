/** Authenticated principal context passed to every service method. */
import type { AccountStatus, Role } from "./identity";

export interface ActorContext {
  readonly userId: string;
  readonly roles: ReadonlySet<Role>;
  readonly accountStatus: AccountStatus;
  readonly profileComplete: boolean;
  readonly locale: string;
}

export interface ActorContextInput {
  readonly userId: string;
  readonly roles: Iterable<Role>;
  readonly accountStatus: AccountStatus;
  readonly profileComplete: boolean;
  readonly locale: string;
}

/** Build an ActorContext, normalizing `roles` to a ReadonlySet. */
export function createActorContext(input: ActorContextInput): ActorContext {
  return {
    userId: input.userId,
    roles: new Set(input.roles),
    accountStatus: input.accountStatus,
    profileComplete: input.profileComplete,
    locale: input.locale,
  };
}

export function actorHasRole(actor: ActorContext, role: Role): boolean {
  return actor.roles.has(role);
}

export function actorHasAnyRole(actor: ActorContext, roles: Iterable<Role>): boolean {
  for (const role of roles) {
    if (actor.roles.has(role)) {
      return true;
    }
  }
  return false;
}
