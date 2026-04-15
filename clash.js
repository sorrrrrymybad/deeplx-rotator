// clash.js
import config from './config.js'

const PSEUDO_NODES = new Set(['DIRECT', 'REJECT', 'GLOBAL', 'PROXY'])

let nodes = []
let index = 0
export let effectiveRetries = 0

/**
 * 初始化：从 Clash API 获取代理组节点列表
 * 应在服务启动时 await 调用一次
 */
export async function init() {
  const url = `http://${config.CLASH_CONTROLLER}/proxies/${encodeURIComponent(config.CLASH_GROUP)}`
  const headers = { Authorization: `Bearer ${config.CLASH_SECRET}` }

  try {
    const res = await fetch(url, { headers })
    if (!res.ok) {
      console.warn(`[clash] 获取节点列表失败，HTTP ${res.status}，服务将以无代理模式运行`)
      return
    }
    const data = await res.json()
    const all = data.now !== undefined
      ? (data.all ?? [])   // 代理组格式
      : Object.keys(data.proxies ?? {})  // 兜底
    nodes = all.filter((name) => !PSEUDO_NODES.has(name))
    effectiveRetries = Math.min(config.MAX_RETRIES, nodes.length)
    console.log(`[clash] 初始化完成，节点数: ${nodes.length}，有效重试次数: ${effectiveRetries}`)
  } catch (err) {
    console.warn(`[clash] 无法连接 Clash Controller: ${err.message}，服务将以无代理模式运行`)
  }
}

/**
 * Round Robin 返回下一个节点名称
 * @returns {string}
 */
export function nextProxy() {
  const node = nodes[index % nodes.length]
  index = (index + 1) % nodes.length
  return node
}

/**
 * 切换 Clash 代理组到指定节点
 * @param {string} nodeName
 * @throws {Error} 切换失败时抛出
 */
export async function switchProxy(nodeName) {
  const url = `http://${config.CLASH_CONTROLLER}/proxies/${encodeURIComponent(config.CLASH_GROUP)}`
  const headers = {
    Authorization: `Bearer ${config.CLASH_SECRET}`,
    'Content-Type': 'application/json',
  }
  const res = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ name: nodeName }),
  })
  if (!res.ok) {
    throw new Error(`切换节点失败，HTTP ${res.status}`)
  }
}
