# ChatBot Worker

这是聊天机器人的后端服务，运行在 Cloudflare Workers 上。

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.dev.vars.example` 为 `.dev.vars`：

```bash
cp .dev.vars.example .dev.vars
```

然后编辑 `.dev.vars` 文件，填入你的 OpenAI API Key：

```env
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### 3. 本地开发

```bash
npx wrangler dev
```

服务将在 http://localhost:8787 启动

### 4. 测试 API

所有请求都通过 GraphQL 发送到 `/graphql`。

**健康检查（Query）：**
```bash
curl -X POST http://localhost:8787/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { health { status timestamp } }"
  }'
```

**发送聊天消息（Mutation）：**
```bash
curl -X POST http://localhost:8787/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation($messages: [MessageInput!]!) { sendMessage(messages: $messages) { content } }",
    "variables": {
      "messages": [
        {"role": "user", "content": "你好"}
      ]
    }
  }'
```

## 部署到 Cloudflare

### 1. 登录 Cloudflare

```bash
npx wrangler login
```

### 2. 设置生产环境密钥

```bash
npx wrangler secret put OPENAI_API_KEY
# 输入你的 OpenAI API Key
```

### 3. 部署

```bash
npx wrangler deploy
```

部署成功后，你会得到一个 URL，例如：
`https://chatbot-worker.your-subdomain.workers.dev`

### 4. 更新前端配置

将部署后的 URL 配置到前端项目的 `.env` 文件中：

```env
VITE_API_URL=https://chatbot-worker.your-subdomain.workers.dev
```

## GraphQL Schema

```graphql
type Query {
  health: HealthStatus!
}

type Mutation {
  sendMessage(messages: [MessageInput!]!): ChatResponse!
}

type HealthStatus {
  status: String!
  timestamp: String!
}

type ChatResponse {
  content: String!
}

input MessageInput {
  role: String!
  content: String!
}
```

## 目录结构

```
chatBotWorker/
├── src/
│   └── index.ts          # 主要源代码
├── .dev.vars.example     # 环境变量示例
├── .dev.vars            # 本地环境变量（不提交）
├── .gitignore
├── package.json
├── tsconfig.json
├── wrangler.toml         # Cloudflare Workers 配置
└── README.md
```

## 故障排查

### 问题：CORS 错误
**解决方案：** 确保前端的域名已添加到 `src/index.ts` 中的 CORS 配置

### 问题：OpenAI API Key 无效
**解决方案：**
- 检查 `.dev.vars` 文件中的 key 是否正确
- 确保生产环境使用 `wrangler secret put OPENAI_API_KEY` 设置了正确的 key

### 问题：429 Too Many Requests
**解决方案：** OpenAI API 有速率限制，考虑升级账户或添加请求节流

## 相关链接

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [GraphQL Yoga 文档](https://the-guild.dev/graphql/yoga-server)
- [OpenAI API 文档](https://platform.openai.com/docs/api-reference)
