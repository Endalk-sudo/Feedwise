import { Request, Response, NextFunction } from 'express';
import { auth } from '@/lib/auth.js';
import { prisma } from '@/lib/prisma.js';
import { fromNodeHeaders } from 'better-auth/node';

/**
 * Middleware to verify Better Auth session
 * Attaches user and session to request object
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized - No valid session',
      });
      return;
    }

    // Attach user and session to request
    (req as any).user = session.user;
    (req as any).session = session;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Unauthorized - Invalid session',
    });
  }
}

/**
 * Optional auth middleware - doesn't fail if no session
 * Useful for routes that work with or without auth
 */
export async function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (session?.user) {
      (req as any).user = session.user;
      (req as any).session = session;
    }
    next();
  } catch (error) {
    // Ignore errors, continue without auth
    next();
  }
}

/**
 * Require specific organization membership
 */
export function requireOrganizationMember(role?: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = (req as any).user;
    const organizationId = req.params.orgId || req.body.organizationId || req.query.organizationId;

    if (!user || !organizationId) {
      res.status(403).json({ success: false, message: 'Forbidden - Organization required' });
      return;
    }

    const member = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: organizationId as string,
        },
      },
    });

    if (!member) {
      res.status(403).json({ success: false, message: 'Forbidden - Not a member of this organization' });
      return;
    }

    if (role && member.role !== role && member.role !== 'owner') {
      res.status(403).json({ success: false, message: 'Forbidden - Insufficient role' });
      return;
    }

    (req as any).organizationMember = member;
    next();
  };
}