# 生产部署检查清单

> 生成时间：2026-03-28 13:58 GMT+8  
> 依据：~/.openclaw/workspace/exam-prediction 项目第8轮迭代阶段1

---

## 环境变量（必须设置）

> 配置文件：`exam-prediction/.env`（docker-compose-all.yml 通过 ${VAR} 引用）

- [ ] **CORS_ALLOWED_ORIGINS**=`https://实际域名`（Nginx $ALLOWED_ORIGINS）
- [ ] **SECRET_KEY**=`<强随机值，64字符>`（JWT 签名密钥，已有 JWT_SECRET_KEY，需补充普通 SECRET_KEY）
- [ ] **JWT_SECRET_KEY**=`<强随机值>` ✅ 当前已有 `638a9cf5502c4bfa2e9a336feedc2da151d1540ba7b95e929eb73749edad2f72`，生产需替换
- [ ] **MINIMAX_API_KEY**=`<真实Key>` ✅ 当前已有 sk-cp-sVMRWV6NouTusutnV2ZcnyVtZYiAE0_ofvoRnZQx3THOGj8vNTiDlFVxV5upGb7-6CkYiRdHin_PePZzLTvVD4f4czi-0ng8NWpASoWuEug2B12_X692vK4，需确保持续有效
- [ ] **PYTHON_API_URL**=`https://python-api.实际域名`（缺失，需补充）
- [ ] **POSTGRES_PASSWORD**=`<强密码>` ⚠️ 当前为 `postgres`，必须替换
- [ ] **NEO4J_PASSWORD**=`<强密码>` ⚠️ 当前为 `password123`，必须替换（docker-compose-all.yml 会对默认值拒绝启动）
- [ ] **MINIO_SECRET_KEY**=`<强密码>` ⚠️ 当前为 `minioadmin`，必须替换
- [ ] **DB_PASSWORD**=`<强密码>` ⚠️ 当前为 `postgres`，必须替换

### 当前 .env 已知问题汇总

| 变量 | 当前值 | 风险 |
|------|--------|------|
| NEO4J_PASSWORD | password123 | 容器启动失败（强密码校验） |
| POSTGRES_PASSWORD | postgres | 弱密码 |
| MINIO_SECRET_KEY | minioadmin | 弱密码 |
| CORS_ALLOWED_ORIGINS | 未设置 | 生产 CORS 失效 |
| PYTHON_API_URL | 未设置 | 前端无法正确调用 |
| SECRET_KEY | 未设置 | 普通会话签名缺失 |

---

## 数据库

- [ ] **Neo4j 数据迁移**：PREREQUISITE → PREREQ_TO（如有历史数据）

```bash
# 连接 Neo4j（容器内或 bolt://localhost:7687），执行：
MATCH (a)-[r:PREREQUISITE]->(b)
CREATE (a)-[r2:PREREQ_TO]->(b)
DELETE r
```

> 注意：`deploy/docker-compose-all.yml` 中 Neo4j 启用了 APOC 插件，迁移 Cypher 可直接运行。

---

## Docker Compose

- [x] **使用 docker-compose-all.yml**：✅ 已存在 `deploy/docker-compose-all.yml`
- [x] **网络配置**：✅ 使用默认 bridge 网络（`deploy_default`），无需额外配置
- [ ] **生产启动命令**：

```bash
cd ~/.openclaw/workspace/exam-prediction/deploy
docker compose -f docker-compose-all.yml up -d
```

---

## Nginx

### TLS 证书配置（443 端口）— ✅ 已完成

**当前状态：** nginx 已配置自签名证书（HTTPS 443 已启用）

**立即测试：**
```bash
curl -k https://localhost:443/
# 或
curl -k https://127.0.0.1:443/
```

**浏览器访问：** https://exam.local （浏览器会显示"不安全"警告，属于正常现象，因为使用了自签名证书）

### 升级到 Let's Encrypt（域名到位后）

当您获得真实域名后，运行一键升级脚本：

```bash
cd ~/.openclaw/workspace/exam-prediction/deploy
./setup-letsencrypt.sh your-domain.com admin@your-domain.com
```

**前置条件：**
- 域名已购买，DNS 已指向本服务器 IP
- 80 端口对外开放

**脚本会自动：**
1. 申请 Let's Encrypt 免费证书（有效期 90 天，自动续期）
2. 更新 nginx.conf 的 server_name
3. 启用 HTTP → HTTPS 重定向
4. 重启 nginx

---

- [x] **TLS 证书已生成：** 自签名证书位于 `./ssl/tls.crt` + `./ssl/tls.key`
- [x] **HTTPS server 块已启用：** nginx.conf 中 HTTPS server 已配置
- [x] **SSL volume 已挂载：** docker-compose-all.yml 中 `./ssl:/etc/nginx/ssl:ro`
- [ ] **ALLOWED_ORIGINS 设置为实际域名：** 当前为 `localhost`，生产环境需设置为真实域名
- [ ] **HTTP 自动跳转 HTTPS：** Let's Encrypt 配置完成后自动启用

---

## 前端

- [ ] **NEXT_PUBLIC_API_URL**=`https://api.实际域名`（检查 `frontend/.env.production`）
- [ ] **PYTHON_API_URL 生产指向**：确认 `frontend/.env.production` 中 `PYTHON_API_URL` 指向生产地址
- [ ] **Build 验证**：`npm run build` 成功

> 前端构建目录：`~/.openclaw/workspace/exam-prediction/frontend`

```bash
cd ~/.openclaw/workspace/exam-prediction/frontend
npm run build
```

---

## requirements.txt 完整性

**文件位置**：`python-backend/requirements.txt`

- [ ] **PyJWT>=2.0**：⚠️ **缺失**，`requirements.txt` 当前包含 `python-jose[cryptography]`（提供 JWT 功能），但**未显式声明 `PyJWT>=2.0`**。

### 当前 requirements.txt 关键依赖

```
fastapi==0.110.0
uvicorn[standard]
pydantic
python-jose[cryptography]   ← JWT 支持
passlib[bcrypt]             ← 密码哈希
httpx
neo4j>=5.0,<6.0
anthropic
langchain
langchain-anthropic
python-multipart
python-dotenv
```

### 建议补充

```txt
PyJWT>=2.0
```

---

## 部署前必检项总结

| # | 检查项 | 状态 |
|---|--------|------|
| 1 | 所有环境变量设为生产值（非默认值） | ⚠️ 5项未完成 |
| 2 | `PyJWT>=2.0` 写入 requirements.txt | ⚠️ 缺失 |
| 3 | Neo4j PREREQUISITE → PREREQ_TO 迁移 | ⬜ 待执行（如有历史数据） |
| 4 | docker-compose-all.yml 就位 | ✅ |
| 5 | Nginx TLS 证书配置 | ⬜ 待配置 |
| 6 | 前端 `npm run build` 成功 | ⬜ 待验证 |
| 7 | CORS_ALLOWED_ORIGINS 设为实际域名 | ⚠️ 未设置 |
| 8 | HTTP → HTTPS 跳转启用 | ⬜ 待启用 |

---

## 部署流程（推荐顺序）

1. 填写 `.env` 所有生产值
2. 补充 `PyJWT>=2.0` 到 `python-backend/requirements.txt`
3. 挂载 TLS 证书，取消 nginx.conf HTTPS 块注释
4. 启动基础设施：`docker compose -f docker-compose-all.yml up -d postgres redis neo4j minio`
5. 执行 Neo4j 数据迁移（如有历史数据）
6. 启动 API 层：`docker compose -f docker-compose-all.yml up -d java-api python-api`
7. 前端构建：`cd frontend && npm run build`
8. 启动 Nginx：`docker compose -f docker-compose-all.yml up -d nginx`
9. 验证：访问前端域名，检查 API 调用、CORS、JWT 登录

---

## Ready to Deploy 判定

**当前状态**：⚠️ **NOT Ready to Deploy**

原因：
1. 5个关键环境变量使用弱默认值（NEO4J_PASSWORD=password123 等）
2. `PyJWT>=2.0` 未写入 requirements.txt
3. Nginx TLS 证书未配置
4. CORS_ALLOWED_ORIGINS 未设置
5. 前端 npm build 未验证

完成上述全部检查项后，系统方可进入生产部署。
