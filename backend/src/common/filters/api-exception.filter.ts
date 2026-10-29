import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";

interface HttpResponse {
  status(code: number): { json(body: unknown): void };
}

interface ErrorBody {
  statusCode: number;
  error: string;
  message: string | string[];
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<HttpResponse>();

    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json(this.fromHttp(exception));
      return;
    }

    this.logger.error(exception);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: "INTERNAL_ERROR",
      message: "Internal server error",
    });
  }

  private fromHttp(exception: HttpException): ErrorBody {
    const statusCode = exception.getStatus();
    const body = exception.getResponse();

    if (typeof body === "string") {
      return { statusCode, error: exception.name, message: body };
    }

    const record = body as { error?: unknown; message?: unknown };
    const message = record.message ?? exception.message;
    const error =
      typeof record.error === "string" ? record.error : exception.name;

    return {
      statusCode,
      error,
      message:
        typeof message === "string" || Array.isArray(message)
          ? message
          : exception.message,
    };
  }
}
