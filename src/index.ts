import { createSchema, createYoga } from 'graphql-yoga'

// 环境变量类型定义
type Env = {
  OPENAI_API_KEY: string
}

// GraphQL Schema
const schema = createSchema({
  typeDefs: `
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
  `,
  resolvers: {
    Query: {
      health: () => ({
        status: 'ok',
        timestamp: new Date().toISOString()
      })
    },
    Mutation: {
      sendMessage: async (_: any, { messages }: any, context: any) => {
        try {
          // 验证请求数据
          if (!messages || !Array.isArray(messages)) {
            throw new Error('Invalid request: messages array is required')
          }

          // 调用 OpenAI API (非流式)
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${context.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',  // 或者使用 gpt-4o、gpt-3.5-turbo 等
              messages: messages,
              stream: false,  // 非流式
              temperature: 0.7,
            }),
          })

          // 检查 OpenAI API 响应
          if (!response.ok) {
            const errorData = await response.text()
            console.error('OpenAI API error:', errorData)
            throw new Error(`OpenAI API error: ${response.statusText}`)
          }

          const data = await response.json() as {
            choices?: Array<{
              message?: {
                content?: string
              }
            }>
          }
          const content = data.choices?.[0]?.message?.content || ''

          return { content }
        } catch (error) {
          console.error('sendMessage error:', error)
          throw error
        }
      }
    }
  }
})

// 创建 GraphQL Yoga 实例
const yoga = createYoga({
  schema,
  cors: {
    origin: [
      'http://localhost:5173',      // Vite 默认端口
      'http://localhost:5174',      // Vite HMR 备用端口
      'http://localhost:5175',      // 额外本地端口
      'http://localhost:3000',      // 备用本地端口
      'https://chatbotfrontend-dhd.pages.dev',
      'https://chat.qincai.digital'
    ],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'OPTIONS']
  },
  graphqlEndpoint: '/graphql',
  // 传递环境变量到 context
  context: async ({ request }) => {
    return {
      env: (request as any).env || {}
    }
  }
})

// Cloudflare Workers Fetch Handler
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // 将环境变量附加到 request 对象
    (request as any).env = env

    // 处理 GraphQL 请求
    return yoga.handleRequest(request, { env, ctx })
  }
}
