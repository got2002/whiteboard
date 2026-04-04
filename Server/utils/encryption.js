function encodeWithDynamicKey(str) {
  const key = Math.floor(Date.now() / 1000) % 256 // ใช้วินาที 0–255

  const dataBuffer = Buffer.from(str, 'utf-8')

  // XOR
  for (let i = 0; i < dataBuffer.length; i++) {
    dataBuffer[i] ^= key
  }

  // 🔥 สร้าง buffer: [key][data]
  const result = Buffer.concat([
    Buffer.from([key]), // 1 byte
    dataBuffer
  ])

  return result
}

function decodeWithDynamicKey(buffer) {
  const key = buffer[0] // byte แรก
  const dataBuffer = buffer.slice(1)

  for (let i = 0; i < dataBuffer.length; i++) {
    dataBuffer[i] ^= key
  }

  return dataBuffer.toString('utf-8')
}

module.exports = {
  encodeWithDynamicKey,
  decodeWithDynamicKey
}