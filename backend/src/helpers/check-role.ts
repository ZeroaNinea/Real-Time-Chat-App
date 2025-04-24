import { Request, Response, NextFunction } from 'express';

import { ChatDocument } from '../models/chat.model';

export function hasRequiredRole(requiredRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const chat = req.chat as ChatDocument;
    const member = chat.members.find((m: any) => m.user.equals(req.user._id));
    const hasRole = member?.roles.some((r: string) =>
      requiredRoles.includes(r)
    );

    if (!hasRole) {
      return res.status(403).json({ message: 'Insufficient role' });
    }

    next();
  };
}
