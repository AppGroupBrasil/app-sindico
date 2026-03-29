# Deploy — App Síndico (Hetzner)

## Deploy Rápido

### 1. Upload dos arquivos alterados
```powershell
# Da máquina local (PowerShell):
scp -i ~/.ssh/hetzner_key -r ./src root@46.225.191.114:/opt/app-sindico/
scp -i ~/.ssh/hetzner_key -r ./server root@46.225.191.114:/opt/app-sindico/
scp -i ~/.ssh/hetzner_key -r ./public root@46.225.191.114:/opt/app-sindico/
scp -i ~/.ssh/hetzner_key ./index.html ./package.json ./package-lock.json ./.env root@46.225.191.114:/opt/app-sindico/
```

### 2. Rebuild e restart no servidor
```powershell
ssh -i ~/.ssh/hetzner_key root@46.225.191.114 "cd /opt/app-sindico && docker compose down && docker compose build --no-cache && docker compose up -d"
```

### 3. Conferir se está rodando
```powershell
ssh -i ~/.ssh/hetzner_key root@46.225.191.114 "docker ps --filter name=appsindico --format 'table {{.Names}}\t{{.Status}}'"
```

---

## Estrutura no Servidor

| Item | Caminho |
|------|---------|
| Projeto | `/opt/app-sindico/` |
| Dockerfile | `/opt/app-sindico/Dockerfile` |
| docker-compose | `/opt/app-sindico/docker-compose.yml` |
| Nginx config | `/opt/app-sindico/nginx.conf` |
| Código fonte | `/opt/app-sindico/src/` |
| Assets | `/opt/app-sindico/public/` |
| Variáveis | `/opt/app-sindico/.env` |

## Dados Importantes

- **Servidor:** `46.225.191.114` (Hetzner, Ubuntu 22.04, 2 vCPU, 4GB RAM + 4GB Swap, 38GB disco)
- **SSH:** `ssh -i ~/.ssh/hetzner_key root@46.225.191.114`
- **Containers:** `appsindico-app` (nginx:alpine), `appsindico-api` (node:20-alpine), `appsindico-db` (postgres:16-alpine)
- **Rede Docker:** `coolify` (compartilhada com Traefik v3.6)
- **Domínio:** `appsindico.com.br` (HTTPS via Traefik/LetsEncrypt)
- **Cloudflare NS:** `audrey.ns.cloudflare.com` / `weston.ns.cloudflare.com`

## Cenários de Atualização

### Mudou schema do banco (migrações)
Executar migrações ANTES do deploy:
```powershell
# Copiar arquivo de migração
scp -i ~/.ssh/hetzner_key ./server/src/db/migrations/<MIGRATION_FILE>.sql root@46.225.191.114:/tmp/

# Executar no container do banco
ssh -i ~/.ssh/hetzner_key root@46.225.191.114 "docker exec -i appsindico-db psql -U appsindico -d appsindico < /tmp/<MIGRATION_FILE>.sql"
```

### Mudou só código (CSS/TSX, sem novas dependências)
Mesmo processo — passos 1, 2 e 3 acima.

### Adicionou novas dependências (npm install)
Atualizar o `package-lock.json` local e incluir no upload do passo 1.

### Mudou Dockerfile, nginx.conf ou docker-compose.yml
```powershell
scp -i ~/.ssh/hetzner_key ./Dockerfile ./docker-compose.yml ./nginx.conf root@46.225.191.114:/opt/app-sindico/
```
Depois rebuild normalmente (passo 2).

## Outros Apps no Mesmo Servidor

| App | Domínio | Porta | Diretório |
|-----|---------|-------|-----------|
| app-correspondencia | appcorrespondencia.com.br | 3000 | /opt/app-correspondencia/ |
| portariax | portariax.com.br | 3001 | /opt/portariax/ |
| app-sindico | appsindico.com.br | 3000 | /opt/app-sindico/ |
| app-obras | appobras.com.br | 8080 | — |
| app-manutencao | manutencaox.com.br | 8080 | — |
| app-reserva | appreserva.com.br | 3000 | /opt/app-reserva/ |

## Firebase

- **Projeto portariax-app:** Usado APENAS para FCM (push notifications)
- **Projeto appmanutencao:** Atualmente usado para Auth/Firestore (migração para Hetzner pendente)
