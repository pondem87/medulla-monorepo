import { Test, TestingModule } from '@nestjs/testing';
import { ChatMessageHistoryProvider } from './chat-message-history-provider';
import { ChatMessageHistoryService } from './chat-message-history.service';
import { ConfigService } from '@nestjs/config';
import { ChatMessageHistory } from './chat-message-history';
import { LoggingService } from '@app/medulla-common/logging/logging.service';

jest.mock('./chat-message-history', () => ({
  ChatMessageHistory: jest.fn().mockImplementation(() => {
    return {init: jest.fn()}
  })
}))

const mockedChatMessageHistory = jest.mocked(ChatMessageHistory, {shallow: true})

describe('ChatMessageHistoryProvider', () => {
  let cmhp: ChatMessageHistoryProvider;
  
  const chatHistoryWindowLength = 5

  const mockLoggingService = {
    getLogger: jest.fn().mockReturnValue({
      info: jest.fn((...args) => console.log(`Logged info: ${args}`))
    })
  }

  const mockChatMessageHistoryService = null

  const mockConfigService = {
    get: jest.fn((key) => {
      switch (key) {
        case "CHAT_HISTORY_WINDOW_LENGTH":
          return `${chatHistoryWindowLength}`
        default:
          return null
      }
    })
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatMessageHistoryProvider,
        {
          provide: LoggingService,
          useValue: mockLoggingService
        },
        {
          provide: ChatMessageHistoryService,
          useValue: mockChatMessageHistoryService
        },
        {
          provide: ConfigService,
          useValue: mockConfigService
        }
      ],
    }).compile();

    cmhp = module.get<ChatMessageHistoryProvider>(ChatMessageHistoryProvider);

    mockedChatMessageHistory.mockClear()
  });

  it('should be defined', () => {
    expect(cmhp).toBeDefined();
  });

  it('should create a ChatMessageHistory object with the given number, logger, ChatHistoryService and CHAT_HISTORY_WINDOW_LENGTH', async () => {
    const cmh = await cmhp.getChatMessageHistory({userNumber: "263775409679"})

    expect(ChatMessageHistory).toHaveBeenCalledTimes(1)
    expect(ChatMessageHistory).toHaveBeenCalledWith(mockLoggingService.getLogger(), mockChatMessageHistoryService, chatHistoryWindowLength)
    expect(cmh.init).toHaveBeenCalledTimes(1)
    expect(cmh.init).toHaveBeenCalledWith({userNumber: "263775409679"})
  })

});