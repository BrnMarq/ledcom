import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import prisma from "../client";

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not defined');
}
const JWT_SECRET = process.env.JWT_SECRET;

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class AuthService {
  async register(email: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    const token = this.generateToken(user.id);
    return { user: { id: user.id, email: user.email }, token };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      throw new Error('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Credenciales inválidas');
    }

    const token = this.generateToken(user.id);
    return { user: { id: user.id, email: user.email }, token };
  }

  async loginWithGoogle(idToken: string) {
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      
      if (!payload || !payload.email) {
        throw new Error('Invalid Google token payload');
      }

      const { email, sub: googleId } = payload;

      let user = await prisma.user.findUnique({
        where: { email },
      });

      if (user) {
        // Link googleId if it doesn't exist on this user
        if (!user.googleId) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { googleId },
          });
        }
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            email,
            googleId,
          },
        });
      }

      const token = this.generateToken(user.id);
      return { user: { id: user.id, email: user.email }, token };
    } catch (error) {
      throw new Error('Failed to authenticate with Google');
    }
  }

  private generateToken(userId: number) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
  }
}
