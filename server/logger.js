const { createLogger, transports, format } = require("winston")

const customFormat = format.combine(
    format.timestamp({format: "YYYY-MM-DD HH:mm:ss"}),
    format.printf((info) => {
    return `${info.timestamp} = [${info.level.toUpperCase().padEnd(6)}] - ${info.message}`
}))

const logger = createLogger({
    format: customFormat,
    transports: [
        new transports.File({filename: "./logs/all.log", level: "silly"})
    ]
})

module.exports = { logger }