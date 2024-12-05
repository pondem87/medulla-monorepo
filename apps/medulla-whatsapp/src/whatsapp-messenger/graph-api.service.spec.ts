import { Test, TestingModule } from "@nestjs/testing";
import { GraphAPIService } from "./graph-api.service";
import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { mockedLoggingService } from "../common/mocks";
import { ConfigService } from "@nestjs/config";
import { TextMessageBody } from "./types";

global.fetch = jest.fn()

describe('GraphAPIService', () => {
    let service: GraphAPIService;

    const mockConfigService = {
        get: jest.fn().mockImplementation((key) => {
            switch (key) {
                case "WHATSAPP_GRAPH_API":
                    return "WHATSAPP_GRAPH_API"
                case "WHATSAPP_API_VERSION":
                    return "WHATSAPP_API_VERSION"
                case "WHATSAPP_NUMBER_ID":
                    return "WHATSAPP_NUMBER_ID"
                case "WHATSAPP_SYSTEM_TOKEN":
                    return "WHATSAPP_SYSTEM_TOKEN"
                default:
                    return ""
            }
        })
    }

    let fetchSpy

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GraphAPIService,
                {
                    provide: LoggingService,
                    useValue: mockedLoggingService
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService
                }
            ],
        }).compile();

        service = module.get<GraphAPIService>(GraphAPIService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('call fetch endpoint', async () => {
        const messageBody: TextMessageBody = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: "267778778678",
            type: "text",
            text: {
                body: "this is the body",
                preview_url: true
            }
        }

        fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({
                messaging_product: "whatsapp",
                contacts: [
                    {
                        input: "input",
                        wa_id: "wa_id"
                    }
                ],
                messages: [
                    {
                        id: "message-id",
                        message_status: "accepted",
                    }
                ]
            })
        } as unknown as Response)

        const res = await service.messages(messageBody)

        expect(fetchSpy).toHaveBeenCalledTimes(1)
        expect(fetchSpy).toHaveBeenCalledWith(
            `WHATSAPP_GRAPH_API/WHATSAPP_API_VERSION/WHATSAPP_NUMBER_ID/messages`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer WHATSAPP_SYSTEM_TOKEN`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(messageBody)
                }
        )

        console.log(res)
    })

})