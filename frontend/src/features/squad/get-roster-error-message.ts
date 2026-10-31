import { readErrorCode, readErrorMessage } from "@shared/api/error-message";

import { DUPLICATE_MEMBER, MEMBER_NOT_FOUND, SQUAD_FULL } from "./error-code";

export function getRosterErrorMessage(error: unknown): string {
  const code = readErrorCode(error);

  if (
    code === SQUAD_FULL ||
    code === DUPLICATE_MEMBER ||
    code === MEMBER_NOT_FOUND
  ) {
    return readErrorMessage(error);
  }

  return "Could not update the squad";
}
