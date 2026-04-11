export function successResponse(data: any, message?: string) {
  return {
    success: true,
    message: message || 'Success',
    data,
  };
}

export function errorResponse(code: string, message: string, details?: any) {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}
