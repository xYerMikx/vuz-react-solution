import { createParamDecorator, type ExecutionContext } from "@nestjs/common";

export const CurrentUserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<{ userId?: string }>();
    return request.userId ?? "";
  },
);
