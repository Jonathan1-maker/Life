// Redis is optional - stub it out when not available
const redisClient = {
  isReady: false,
  get: async () => null,
  setEx: async () => null,
  del: async () => null,
}

const connectRedis = async () => {
  console.log('⚠️  Redis disabled - running without cache')
}

module.exports = { redisClient, connectRedis }
