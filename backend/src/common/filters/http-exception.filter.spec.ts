import { ArgumentsHost, Logger } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

function createHost(exceptionUrl = '/finalizations') {
  const status = jest.fn().mockReturnThis();
  const json = jest.fn();
  const response = { status, json };
  const request = { method: 'POST', url: exceptionUrl };

  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;

  return { host, json, status };
}

describe('HttpExceptionFilter', () => {
  it('logs unhandled errors before returning a safe internal error response', () => {
    const loggerSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const filter = new HttpExceptionFilter();
    const { host, json, status } = createHost();
    const error = new Error('database insert failed');

    filter.catch(error, host);

    expect(loggerSpy).toHaveBeenCalledWith(
      'POST /finalizations failed with unhandled error',
      error.stack,
    );
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        path: '/finalizations',
        message: 'Erro interno no servidor',
      }),
    );

    loggerSpy.mockRestore();
  });
});
