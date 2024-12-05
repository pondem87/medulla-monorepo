
const logger = jest.fn().mockImplementation((...any) => console.log(...any))

export const mockedLoggingService = {
    getLogger: jest.fn().mockReturnValue({
        debug: logger,
        info: logger,
        warn: logger,
        error: logger
    })
}