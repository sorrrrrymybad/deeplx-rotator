// deepl.js
// 使用 undici 自身的 fetch 和 ProxyAgent，避免与 Node.js 24 内置 fetch 的版本冲突
import { ProxyAgent, fetch } from 'undici'

const DEEPL_URL = 'https://www2.deepl.com/jsonrpc'

function getICount(text) {
  return text.split('i').length - 1
}

function getRandomNumber() {
  const random = Math.floor(Math.random() * 99999) + 1e5
  return random * 1e3
}

function getTimestamp(iCount) {
  const ts = Date.now()
  if (iCount !== 0) {
    const adjusted = iCount + 1
    return ts - (ts % adjusted) + adjusted
  }
  return ts
}

function handlerBodyMethod(random, body) {
  const calc = (random + 5) % 29 === 0 || (random + 3) % 13 === 0
  const method = calc ? '"method" : "' : '"method": "'
  return body.replace('"method":"', method)
}

function getBody({ from, to, text }) {
  const random = getRandomNumber()
  const iCount = getICount(text)
  const timestamp = getTimestamp(iCount)
  const bodyString = JSON.stringify({
    jsonrpc: '2.0',
    method: 'LMT_handle_texts',
    params: {
      splitting: 'newlines',
      lang: {
        source_lang_user_selected: from,
        target_lang: to,
      },
      texts: [{ text, requestAlternatives: 3 }],
      timestamp,
    },
    id: random,
  })
  return handlerBodyMethod(random, bodyString)
}

function parse2DeepLX(data, to) {
  const from = data.result.lang
  const texts = data.result.texts[0]
  return {
    code: 200,
    id: data.id,
    method: 'Free',
    from,
    to,
    source_lang: from,
    target_lang: to,
    data: texts.text,
    alternatives: texts.alternatives.map((i) => i.text),
  }
}

/**
 * 通过指定代理发送翻译请求
 * @param {{ from: string, to: string, text: string, proxyUrl: string }} options
 * @returns {Promise<object>} 标准化 DeepLX 响应对象
 */
export async function translate({ from, to, text, proxyUrl }) {
  // undici.ProxyAgent 实现 undici Dispatcher 接口，与 Node.js 18+ 原生 fetch 的 dispatcher 参数兼容
  const dispatcher = new ProxyAgent(proxyUrl)
  const body = getBody({ from, to, text })
  const response = await fetch(DEEPL_URL, {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/json' },
    dispatcher,
  })
  if (!response.ok) {
    throw new Error(`DeepL HTTP ${response.status}`)
  }
  const data = await response.json()
  if (!data.result) {
    throw new Error('DeepL response missing result')
  }
  return parse2DeepLX(data, to)
}
