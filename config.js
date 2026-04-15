// config.js
const config = {
  TOKEN: process.env.TOKEN || "",
  PORT: Number(process.env.PORT) || 1234,
  CLASH_CONTROLLER: process.env.CLASH_CONTROLLER || '192.168.31.1:9090',
  CLASH_SECRET: process.env.CLASH_SECRET || '123456',
  CLASH_PROXY_PORT: Number(process.env.CLASH_PROXY_PORT) || 7890,
  CLASH_PROXY_USER: process.env.CLASH_PROXY_USER || 'clash',
  CLASH_PROXY_PASS: process.env.CLASH_PROXY_PASS || '123456',
  CLASH_GROUP: process.env.CLASH_GROUP || '所有-手动',
  MAX_RETRIES: Number(process.env.MAX_RETRIES) || 10,
}

export default config
