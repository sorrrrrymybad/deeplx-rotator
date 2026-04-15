// server.js
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import config from './config.js'
import * as clash from './clash.js'
import { translate } from './deepl.js'

const app = new Hono()

app.post('/:token/translate', async (c) => {
  // 1. 验证 token
  const token = c.req.param('token')
  if (token !== config.TOKEN) {
    return c.json({ code: 401, message: 'Invalid token' }, 401)
  }

  // 2. 解析请求体
  let body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ code: 400, message: 'Invalid JSON body' }, 400)
  }

  const { text, target_lang, source_lang = 'AUTO' } = body
  if (!text || !target_lang) {
    return c.json({ code: 400, message: 'Missing required fields: text, target_lang' }, 400)
  }

  // 3. 检查是否有可用节点
  // clash.effectiveRetries 是 ESM live binding，init() 完成后已被更新为实际值
  if (clash.effectiveRetries === 0) {
    return c.json({ code: 502, message: 'No available proxies (Clash not reachable)' }, 502)
  }

  // 4. 重试循环
  const { CLASH_PROXY_USER, CLASH_PROXY_PASS, CLASH_PROXY_PORT, CLASH_CONTROLLER } = config
  const proxyHost = CLASH_CONTROLLER.split(':')[0]
  const auth = CLASH_PROXY_USER ? `${CLASH_PROXY_USER}:${CLASH_PROXY_PASS}@` : ''
  const proxyUrl = `http://${auth}${proxyHost}:${CLASH_PROXY_PORT}`
  for (let i = 0; i < clash.effectiveRetries; i++) {
    const nodeName = clash.nextProxy()

    try {
      await clash.switchProxy(nodeName)
    } catch (err) {
      console.warn(`[server] 切换节点 ${nodeName} 失败: ${err.message}，跳过`)
      continue
    }

    try {
      const result = await translate({ from: source_lang, to: target_lang, text, proxyUrl })
      return c.json(result, 200)
    } catch (err) {
      console.warn(`[server] 节点 ${nodeName} 翻译失败: ${err.message}`)
    }
  }

  // 5. 全部失败
  return c.json({ code: 502, message: 'All proxies failed' }, 502)
})

// 启动：先初始化 Clash 节点列表，再开始监听
await clash.init()

serve({ fetch: app.fetch, port: config.PORT }, () => {
  console.log(`[server] 服务已启动，监听端口 ${config.PORT}`)
})
