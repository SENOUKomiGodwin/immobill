declare global {
  namespace Express {
    interface Request {
      currentUser?: {
        id: string;
        email: string;
        full_name?: string;
        role: 'admin' | 'user';
      };
      cookies?: {
        refresh_token?: string;
      };
      ownerFilter?: Record<string, unknown>;
    }
  }
}

export interface RequestWithOwnerFilter extends Express.Request {
  ownerFilter?: Record<string, unknown>;
}

export {};
