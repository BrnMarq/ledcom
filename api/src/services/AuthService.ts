import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../client';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

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

    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Credenciales inválidas');
    }

    const token = this.generateToken(user.id);
    return { user: { id: user.id, email: user.email }, token };
  }

  private generateToken(userId: number) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
  }
}
