import { Role, OrgCode } from '@prisma/client';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
      orgCode?: OrgCode | null;
      villageId?: string | null;
      positionTitle?: string | null;
      isActive: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    role?: Role;
    orgCode?: OrgCode | null;
    villageId?: string | null;
    positionTitle?: string | null;
    isActive?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: Role;
    orgCode?: OrgCode | null;
    villageId?: string | null;
    positionTitle?: string | null;
    isActive?: boolean;
  }
}
