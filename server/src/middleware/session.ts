import type { Request, Response, NextFunction } from 'express';
import { sessionModel } from '@/models/sessionModel';

export function sessionMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const codigo = req.headers['x-session-code'] as string | undefined;
  if (codigo) {
    const session = sessionModel.findByCode(codigo);
    if (session) {
      (req as unknown as Record<string, unknown>).sessionId = session.id;
    }
  }
  next();
}
