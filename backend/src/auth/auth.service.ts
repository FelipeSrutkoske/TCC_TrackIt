import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, senha: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Credenciais inválidas');

    let senhaValida = false;

    // Verifica se a senha no banco parece um hash bcrypt ($2b$, $2a$, etc)
    if (user.senha.startsWith('$2')) {
      try {
        senhaValida = await bcrypt.compare(senha, user.senha);
      } catch (e) {
        senhaValida = false;
      }
    } else {
      // Comparação direta para senhas em texto plano (legado)
      senhaValida = user.senha === senha;

      // Se validou em texto plano, vamos atualizar para hash automaticamente
      if (senhaValida) {
        await this.usersService.update(user.id, { senha });
      }
    }

    if (!senhaValida) throw new UnauthorizedException('Credenciais inválidas');

    return user;
  }

  async login(email: string, senha: string) {
    const user = await this.validateUser(email, senha);
    const payload = {
      sub: user.id,
      email: user.email,
      tipoUsuario: user.tipoUsuario,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        tipoUsuario: user.tipoUsuario,
      },
    };
  }
}
