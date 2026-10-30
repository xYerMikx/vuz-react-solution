function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function readErrorCode(error: unknown) {
  if (!isRecord(error) || !isRecord(error.data)) {
    return undefined;
  }

  const { error: code } = error.data;

  if (typeof code === "string") {
    return code;
  }

  return undefined;
}

export function readErrorMessage(error: unknown): string {
  if (!isRecord(error) || !isRecord(error.data)) {
    return "Something went wrong";
  }

  const { message } = error.data;

  if (typeof message === "string") {
    return message;
  }

  if (Array.isArray(message) && typeof message[0] === "string") {
    return message[0];
  }

  return "Something went wrong";
}
