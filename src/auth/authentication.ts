import jsonwebtoken from 'jsonwebtoken';
import dotenv from 'dotenv';
import UserAuth from '../interfaces/userAuth';

dotenv.config();

class Authentication {
  user: UserAuth;

  constructor(user: UserAuth) {
    this.user = user;
  }

  mountToken () {
    return {
      access_token: this.generateToken(this.user),
      refresh_token: this.generateRefreshToken(this.user)
    }
  }

  private generateToken(user: UserAuth) {
    return jsonwebtoken.sign({ id: user.id, email: user.email, role: user.role, type: 'access' }, process.env.JWT_SECRET || '', { expiresIn: '1d', algorithm: 'HS256'});
  }

  static verifyToken(token: string) {

    try {
      const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET || '');
      if (decoded instanceof jsonwebtoken.TokenExpiredError) {
        throw new Error('Token expired');
      }else if (decoded instanceof jsonwebtoken.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      return decoded;
    } catch (err) {
      throw new Error((err as Error).message);
    }
  }

  private generateRefreshToken(user: UserAuth) {
    return jsonwebtoken.sign({ id: user.id, email: user.email, role: user.role, type: 'refresh' }, process.env.JWT_SECRET || '', { expiresIn: '7d', algorithm: 'HS256'});
  }
}

export default Authentication;