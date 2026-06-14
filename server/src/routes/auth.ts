import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { query, queryOne } from '../db/database.js';
import { generateToken, AuthRequest, authMiddleware } from '../middleware/auth.js';
import { checkRateLimit, recordLoginAttempt, auditLog, createNotification } from '../middleware/helpers.js';
import { sendEmail, emailResetSenha } from '../services/email.js';
import { validate, loginSchema, registerSchema, selfRegisterSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema } from '../middleware/validation.js';

const router = Router();

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req, res: Response) => {
  try {
    const { email, senha } = req.body;
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '';

    if (!email || !senha) {
      res.status(400).json({ error: 'Email e senha obrigatórios' });
      return;
    }

    let remaining = 5;

    const user = await queryOne<any>(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    );

    const isMaster = user?.role === 'master';

    // Rate limiting — applies to ALL users, including master
    const { blocked, remaining: rem } = await checkRateLimit(email, ip);
    if (blocked) {
      res.status(429).json({ error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' });
      return;
    }
    remaining = rem;

    if (!user) {
      await recordLoginAttempt(email, ip, false);
      await auditLog(null, 'login_falha', 'usuarios', email, { motivo: 'usuario_nao_encontrado' }, ip).catch(() => {});
      res.status(401).json({ error: 'Credenciais inválidas', remaining: remaining - 1 });
      return;
    }
    // Block check (skip for master)
    if (!isMaster && (!user.ativo || user.bloqueado)) {
      await auditLog(null, 'login_falha', 'usuarios', user.id, { motivo: 'conta_bloqueada', email }, ip).catch(() => {});
      res.status(403).json({ error: 'Conta desativada ou bloqueada', motivo: user.motivo_bloqueio });
      return;
    }

    const validPassword = await bcrypt.compare(senha, user.senha_hash);
    if (!validPassword) {
      await recordLoginAttempt(email, ip, false);
      await auditLog(null, 'login_falha', 'usuarios', user.id, { motivo: 'senha_incorreta', email }, ip).catch(() => {});
      res.status(401).json({ error: 'Credenciais inválidas', remaining: remaining - 1 });
      return;
    }

    await recordLoginAttempt(email, ip, true);
    await auditLog({ id: user.id, nome: user.nome, role: user.role } as any, 'login', 'usuarios', user.id, {}, ip);

    const token = generateToken({ userId: user.id, email: user.email, role: user.role });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        role: user.role,
        administradorId: user.administrador_id,
        supervisorId: user.supervisor_id,
        condominioId: user.condominio_id,
        avatarUrl: user.avatar_url,
      },
    });
  } catch (err: any) {
    console.error('[LOGIN ERROR]', err);
    res.status(500).json({ error: 'Erro interno no login' });
  }
});

// POST /api/auth/register (only admin+ can create users)
router.post('/register', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const caller = req.user!;
    const { email, senha, nome, role, condominioId, supervisorId } = req.body;

    if (!email || !senha || !nome || !role) {
      res.status(400).json({ error: 'email, senha, nome e role são obrigatórios' });
      return;
    }

    // Validar hierarquia
    const roleLevel: Record<string, number> = { master: 4, administrador: 3, supervisor: 2, funcionario: 1 };
    if ((roleLevel[role] ?? 0) >= (roleLevel[caller.role] ?? 0)) {
      res.status(403).json({ error: 'Não pode criar usuário com role igual ou superior' });
      return;
    }

    const exists = await queryOne('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (exists) {
      res.status(409).json({ error: 'Email já cadastrado' });
      return;
    }

    const senhaHash = await bcrypt.hash(senha, 12);

    const adminId = caller.role === 'master' ? null :
      caller.role === 'administrador' ? caller.id : caller.administrador_id;

    const supId = role === 'funcionario' ? (supervisorId || caller.id) : null;

    const user = await queryOne<any>(
      `INSERT INTO usuarios (email, senha_hash, nome, role, criado_por, administrador_id, supervisor_id, condominio_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [email, senhaHash, nome, role, caller.id, adminId, supId, condominioId || null]
    );

    res.status(201).json({
      id: user!.id,
      email: user!.email,
      nome: user!.nome,
      role: user!.role,
    });
  } catch (err: any) {
    console.error('[REGISTER ERROR]', err);
    res.status(500).json({ error: 'Erro interno ao registrar usuário' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const u = req.user!;
  res.json({
    id: u.id,
    email: u.email,
    nome: u.nome,
    role: u.role,
    administradorId: u.administrador_id,
    supervisorId: u.supervisor_id,
    condominioId: u.condominio_id,
    ativo: u.ativo,
    bloqueado: u.bloqueado,
  });
});

// POST /api/auth/change-password
router.post('/change-password', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { senhaAtual, novaSenha } = req.body;
  const user = await queryOne<any>('SELECT senha_hash FROM usuarios WHERE id = $1', [req.user!.id]);

  const valid = await bcrypt.compare(senhaAtual, user!.senha_hash);
  if (!valid) {
    res.status(400).json({ error: 'Senha atual incorreta' });
    return;
  }

  const hash = await bcrypt.hash(novaSenha, 12);
  await query('UPDATE usuarios SET senha_hash = $1 WHERE id = $2', [hash, req.user!.id]);
  res.json({ ok: true });
});

// POST /api/auth/self-register (public — creates 'administrador' or 'sindico' account)
router.post('/self-register', async (req, res: Response) => {
  try {
    const { email, senha, nome, telefone, perfil, nomeCondominio, enderecoCondominio, nomeEmpresa, cnpj } = req.body;

    if (!email || !senha || !nome) {
      res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
      return;
    }
    if (typeof senha !== 'string' || senha.length < 8 || !/[A-Za-z]/.test(senha) || !/\d/.test(senha)) {
      res.status(400).json({ error: 'A senha deve ter no mínimo 8 caracteres, com letra e número' });
      return;
    }
    if (!perfil || !['sindico', 'administradora'].includes(perfil)) {
      res.status(400).json({ error: 'Selecione o tipo de cadastro (sindico ou administradora)' });
      return;
    }
    if (perfil === 'sindico' && !nomeCondominio?.trim()) {
      res.status(400).json({ error: 'Nome do condomínio é obrigatório para síndicos' });
      return;
    }

    const exists = await queryOne('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (exists) {
      res.status(409).json({ error: 'Este e-mail já está cadastrado' });
      return;
    }

    const senhaHash = await bcrypt.hash(senha, 12);
    const role = perfil === 'sindico' ? 'administrador' : 'administrador';

    const user = await queryOne<any>(
      `INSERT INTO usuarios (email, senha_hash, nome, role, telefone, ativo)
       VALUES ($1, $2, $3, $4, $5, true) RETURNING id, email, nome, role`,
      [email, senhaHash, nome, role, telefone || null]
    );

    // Se for síndico, criar o condomínio automaticamente
    if (perfil === 'sindico' && user) {
      try {
        await query(
          `INSERT INTO condominios (nome, endereco, responsavel_id)
           VALUES ($1, $2, $3)`,
          [nomeCondominio.trim(), enderecoCondominio?.trim() || null, user.id]
        );
      } catch (condoErr) {
        console.error('[SELF-REGISTER] Erro ao criar condomínio (non-fatal):', condoErr);
      }
    }

    // Notify all masters about the new registration
    try {
      const tipoCadastro = perfil === 'sindico' ? `Síndico - ${nomeCondominio}` : `Administradora - ${nomeEmpresa || ''}`;
      const masters = await query<any>('SELECT id FROM usuarios WHERE role = $1 AND ativo = true', ['master']);
      for (const m of masters) {
        await createNotification(
          m.id,
          'Novo cadastro',
          `${nome} (${email}) se cadastrou como ${tipoCadastro}.`,
          'info',
          '/usuarios'
        );
      }
      await auditLog(null, 'self_register', 'usuarios', user!.id, { email, nome, perfil, nomeCondominio, nomeEmpresa });
    } catch (notifErr) {
      console.error('[SELF-REGISTER] notification/audit error (non-fatal):', notifErr);
    }

    res.status(201).json({
      message: 'Conta criada com sucesso! Você já pode fazer login.',
      user: { id: user!.id, email: user!.email, nome: user!.nome },
    });
  } catch (err: any) {
    console.error('[SELF-REGISTER ERROR]', err);
    res.status(500).json({ error: 'Erro interno ao criar conta' });
  }
});

// POST /api/auth/forgot-password (public — generates reset token)
router.post('/forgot-password', async (req, res: Response) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: 'Informe o e-mail' });
    return;
  }

  // Always return success to avoid email enumeration
  const user = await queryOne<any>('SELECT id FROM usuarios WHERE email = $1', [email]);

  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    // Create reset_tokens table if needed, or use a simple approach with a column
    await query(
      `CREATE TABLE IF NOT EXISTS reset_tokens (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        token VARCHAR(64) NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`
    );

    // Invalidate previous tokens for this user
    await query('UPDATE reset_tokens SET used = true WHERE user_id = $1 AND used = false', [user.id]);

    await query(
      'INSERT INTO reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiry]
    );

    // Enviar e-mail com link de reset
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const emailData = await emailResetSenha(user.nome || email, token, `${frontendUrl}/esqueci-senha`);
    emailData.to = email;
    await sendEmail(emailData).catch(err => console.error('[RESET] Erro ao enviar email:', err));
  }

  res.json({ message: 'Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.' });
});

// POST /api/auth/reset-password (public — resets password with token)
router.post('/reset-password', async (req, res: Response) => {
  const { token, novaSenha } = req.body;

  if (!token || !novaSenha) {
    res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
    return;
  }
  if (typeof novaSenha !== 'string' || novaSenha.length < 8 || !/[A-Za-z]/.test(novaSenha) || !/\d/.test(novaSenha)) {
    res.status(400).json({ error: 'A senha deve ter no mínimo 8 caracteres, com letra e número' });
    return;
  }

  const record = await queryOne<any>(
    `SELECT rt.user_id, rt.expires_at FROM reset_tokens rt
     WHERE rt.token = $1 AND rt.used = false`,
    [token]
  );

  if (!record || new Date(record.expires_at) < new Date()) {
    res.status(400).json({ error: 'Token inválido ou expirado' });
    return;
  }

  const hash = await bcrypt.hash(novaSenha, 12);
  await query('UPDATE usuarios SET senha_hash = $1 WHERE id = $2', [hash, record.user_id]);
  await query('UPDATE reset_tokens SET used = true WHERE token = $1', [token]);

  res.json({ message: 'Senha redefinida com sucesso! Você já pode fazer login.' });
});

// POST /api/auth/sso — login via token assinado pela central (auth-central)
// Verifica o HMAC do token, acha/cria o usuário local por e-mail e emite o JWT próprio.
const SSO_SECRET = process.env.SSO_SECRET || process.env.JWT_SECRET || '';
const SSO_AUD = 'app-sindico';

const SSO_PUBLIC_KEY = process.env.SSO_PUBLIC_KEY_B64 ? Buffer.from(process.env.SSO_PUBLIC_KEY_B64, 'base64').toString('utf-8').trim() : (process.env.SSO_PUBLIC_KEY || '').trim();

function verificarTokenCentral(token: string): any {
  const partes = token.split('.');
  if (partes.length !== 3) throw new Error('formato inválido');
  const [h, p, sig] = partes;
  const header = JSON.parse(Buffer.from(h, 'base64url').toString());
  if (header.alg === 'RS256') {
    if (!SSO_PUBLIC_KEY) throw new Error('SSO_PUBLIC_KEY ausente');
    const ok = crypto.createVerify('RSA-SHA256').update(`${h}.${p}`).verify(SSO_PUBLIC_KEY, sig, 'base64url');
    if (!ok) throw new Error('assinatura RS256 inválida');
  } else {
    const esperado = crypto.createHmac('sha256', SSO_SECRET).update(`${h}.${p}`).digest('base64url');
    const a = Buffer.from(sig); const b = Buffer.from(esperado);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new Error('assinatura inválida');
  }
  const payload = JSON.parse(Buffer.from(p, 'base64url').toString());
  if (payload.iss !== 'auth-central') throw new Error('emissor inválido');
  if (payload.aud && payload.aud !== SSO_AUD) throw new Error('destino inválido');
  if (typeof payload.exp === 'number' && payload.exp < Math.floor(Date.now() / 1000)) throw new Error('token expirado');
  return payload;
}

const PERFIL_PARA_ROLE: Record<string, string> = {
  gestor: 'administrador',
  funcionario: 'funcionario',
  morador: 'funcionario',
};

router.post('/sso', async (req, res: Response) => {
  try {
    const token = req.body?.token;
    if (!token) { res.status(400).json({ error: 'Token ausente' }); return; }
    if (!SSO_SECRET && !SSO_PUBLIC_KEY) { res.status(500).json({ error: 'SSO não configurado' }); return; }

    const payload = verificarTokenCentral(token);
    const email = String(payload.email || '').toLowerCase().trim();
    if (!email) { res.status(400).json({ error: 'Token sem e-mail' }); return; }

    let user = await queryOne<any>('SELECT * FROM usuarios WHERE lower(email) = $1', [email]);

    if (!user) {
      const role = PERFIL_PARA_ROLE[payload.perfil] || 'funcionario';
      const senhaHash = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 12);
      user = await queryOne<any>(
        `INSERT INTO usuarios (email, senha_hash, nome, role, criado_por, condominio_id)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [email, senhaHash, payload.nome || email, role, null, payload.condominio_id || null],
      );
    }

    if (!user.ativo || user.bloqueado) {
      res.status(403).json({ error: 'Conta desativada ou bloqueada', motivo: user.motivo_bloqueio });
      return;
    }

    await auditLog({ id: user.id, nome: user.nome, role: user.role } as any, 'login_sso', 'usuarios', user.id, { via: 'auth-central' }, '').catch(() => {});

    const jwtLocal = generateToken({ userId: user.id, email: user.email, role: user.role });

    res.json({
      token: jwtLocal,
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        role: user.role,
        administradorId: user.administrador_id,
        supervisorId: user.supervisor_id,
        condominioId: user.condominio_id,
        avatarUrl: user.avatar_url,
      },
    });
  } catch (err: any) {
    console.error('[SSO ERROR]', err?.message);
    res.status(401).json({ error: 'Token SSO inválido ou expirado' });
  }
});

export default router;
