import db from "../../config/database/database";
import bcrypt from 'bcrypt';
import User from '../interfaces/user';
import UserAuth from '../interfaces/userAuth';

class UserRepository {
  async findByEmail(email: string) {
    return await db('users').where('email', email).first();
  }

  async findByEmailAndPassword(email: string, password: string): Promise<UserAuth> {
    let user_data: UserAuth;
    try {
      user_data = await db.transaction(async (trx) => {
        const user = await trx('users')
          .select('users.*', 'roles.name as role')
          .leftJoin('user_roles', 'users.id', 'user_roles.user_id')
          .leftJoin('roles', 'roles.id', 'user_roles.role_id')
          .where('users.email', email)
          .first();

        if (!user) {
          throw new Error('Usuário não encontrado');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          throw new Error('Senha inválida');
        }

        return user;
      });
      console.log(user_data.role);
      return user_data;

    } catch (error) {
      throw error;
    }
  }
}

export default new UserRepository();