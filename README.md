# DeepLX

基于 DeepL 免费接口的翻译 API 服务，通过路径 token 认证，配合 Clash/OpenClash 实现多节点代理轮询，无需 DeepL API Key。

## 特性

- 兼容 DeepLX 标准响应格式
- 路径参数 token 认证
- 通过 Clash External Controller 自动轮询代理节点（Round Robin）
- 节点失败自动切换重试
- 支持 Docker 部署

## 依赖

- Node.js 18+
- 本地或远程运行的 Clash / OpenClash（需开启 External Controller）

## 快速开始

### 直接运行

```bash
npm install
node server.js
```

### Docker

```bash
docker build -t deeplx .

docker run -d \
  --name deeplx \
  --restart unless-stopped \
  -p 1234:1234 \
  deeplx
```

## 配置

所有配置通过环境变量设置，未设置时使用 `config.js` 中的默认值。

| 环境变量 | 说明 |
|----------|------|
| `TOKEN` | API 访问 token（路径参数） |
| `PORT` | 服务监听端口，默认 `1234` |
| `CLASH_CONTROLLER` | Clash External Controller 地址，默认 `192.168.31.1:9090` |
| `CLASH_SECRET` | Clash Controller 密钥，默认 `123456` |
| `CLASH_PROXY_PORT` | Clash 本地 HTTP 代理端口，默认 `7890` |
| `CLASH_PROXY_USER` | 代理认证用户名（OpenClash 需要），默认 `clash` |
| `CLASH_PROXY_PASS` | 代理认证密码，默认 `123456` |
| `CLASH_GROUP` | 要轮询的代理组名称，默认 `所有-手动` |
| `MAX_RETRIES` | 单次请求最大重试节点数，默认 `10` |

## API

### 翻译

```
POST /{token}/translate
Content-Type: application/json
```

**请求体**

```json
{
  "text": "Hello, world!",
  "source_lang": "EN",
  "target_lang": "ZH"
}
```

`source_lang` 可省略，省略时由 DeepL 自动检测。

**响应示例**

```json
{
  "code": 200,
  "id": 123456000,
  "method": "Free",
  "from": "EN",
  "to": "ZH",
  "source_lang": "EN",
  "target_lang": "ZH",
  "data": "你好，世界",
  "alternatives": ["世界，你好", "你好，世界！", "大家好"]
}
```

**错误响应**

| 状态码 | 说明 |
|--------|------|
| `401` | token 错误 |
| `400` | 请求体格式错误或缺少必填字段 |
| `502` | 所有节点均失败或 Clash 不可达 |

**示例**

```bash
curl -X POST http://localhost:1234/{token}/translate \
  -H 'Content-Type: application/json' \
  -d '{"text":"Hello, world!","target_lang":"ZH"}'
```

## 支持的语言

源语言支持 `AUTO`（自动检测）及所有 DeepL 支持的语言代码（`EN`、`ZH`、`JA`、`DE`、`FR` 等），目标语言支持变体（`ZH-HANS`、`EN-GB`、`PT-BR` 等）。

## 特别感谢

- [DeepLX-Lib](https://github.com/lete114/deeplx-lib)

## License

[MIT](./LICENSE) License © [sorrrrrymybad](https://github.com/sorrrrrymybad)
