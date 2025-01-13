import { Test, TestingModule } from "@nestjs/testing";
import { GraphAPIService } from "./graph-api.service";
import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { ConfigService } from "@nestjs/config";
import { mockedLoggingService } from "@app/medulla-common/common/mocks";
import { TextMessageBody } from "@app/medulla-common/common/whatsapp-api-types";

jest.mock("axios")

const formAppend = jest.fn()
jest.mock("form-data", () => {
    return {
        default: jest.fn().mockImplementation(() => {
            return {
                append: formAppend,
                getHeaders: jest.fn()
            }
        })
    }
})

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

    afterEach(() => {
        jest.spyOn(global, 'fetch').mockClear()
    })

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

        let fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
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
    })

    it("should get file extensions", () => {
        const files = [
            {
                url: "https://oaidalleapiprodscus.blob.core.windows.net/private/org-Lq66WMpkjt7XPM2sn64lhBU4/user-DslhPNO1vHCzab22sduqca8H/img-ZXhaDyByzmcJpLFKIbZGf3RQ.jpeg?st=2024-12-28T13%3A19%3A27Z&se=2024-12-28T15%3A19%3A27Z&sp=r&sv=2024-08-04&sr=b&rscd=inline&rsct=image/png&skoid=d505667d-d6c1-4a0a-bac7-5c84a87759f8&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2024-12-27T21%3A04%3A17Z&ske=2024-12-28T21%3A04%3A17Z&sks=b&skv=2024-08-04&sig=c8lf%2BurRUwfznRY30bGLofv0R5zWbXRsjWGJEMDGNZc%3D",
                ext: "jpeg"
            },
            {
                url: "https://oaidalleapiprodscus.blob.core.windows.net/private/org-Lq66WMpkjt7XPM2sn64lhBU4/user-DslhPNO1vHCzab22sduqca8H/img-ZXhaDyByzmcJpLFKIbZGf3RQ.jpg?st=2024-12-28T13%3A19%3A27Z&se=2024-12-28T15%3A19%3A27Z&sp=r&sv=2024-08-04&sr=b&rscd=inline&rsct=image/png&skoid=d505667d-d6c1-4a0a-bac7-5c84a87759f8&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2024-12-27T21%3A04%3A17Z&ske=2024-12-28T21%3A04%3A17Z&sks=b&skv=2024-08-04&sig=c8lf%2BurRUwfznRY30bGLofv0R5zWbXRsjWGJEMDGNZc%3D",
                ext: "jpg"
            },
            {
                url: "https://oaidalleapiprodscus.blob.core.windows.net/private/org-Lq66WMpkjt7XPM2sn64lhBU4/user-DslhPNO1vHCzab22sduqca8H/img-ZXhaDyByzmcJpLFKIbZGf3RQ.png?st=2024-12-28T13%3A19%3A27Z&se=2024-12-28T15%3A19%3A27Z&sp=r&sv=2024-08-04&sr=b&rscd=inline&rsct=image/png&skoid=d505667d-d6c1-4a0a-bac7-5c84a87759f8&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2024-12-27T21%3A04%3A17Z&ske=2024-12-28T21%3A04%3A17Z&sks=b&skv=2024-08-04&sig=c8lf%2BurRUwfznRY30bGLofv0R5zWbXRsjWGJEMDGNZc%3D",
                ext: "png"
            }
        ]

        expect(service.getFileExtension(files[0].url)).toEqual(files[0].ext)
        expect(service.getFileExtension(files[1].url)).toEqual(files[1].ext)
        expect(service.getFileExtension(files[2].url)).toEqual(files[2].ext)
    })

    it("should get mime types", () => {
        const files = [
            {
                url: "https://oaidalleapiprodscus.blob.core.windows.net/private/org-Lq66WMpkjt7XPM2sn64lhBU4/user-DslhPNO1vHCzab22sduqca8H/img-ZXhaDyByzmcJpLFKIbZGf3RQ.jpeg?st=2024-12-28T13%3A19%3A27Z&se=2024-12-28T15%3A19%3A27Z&sp=r&sv=2024-08-04&sr=b&rscd=inline&rsct=image/png&skoid=d505667d-d6c1-4a0a-bac7-5c84a87759f8&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2024-12-27T21%3A04%3A17Z&ske=2024-12-28T21%3A04%3A17Z&sks=b&skv=2024-08-04&sig=c8lf%2BurRUwfznRY30bGLofv0R5zWbXRsjWGJEMDGNZc%3D",
                ext: "jpeg"
            },
            {
                url: "https://oaidalleapiprodscus.blob.core.windows.net/private/org-Lq66WMpkjt7XPM2sn64lhBU4/user-DslhPNO1vHCzab22sduqca8H/img-ZXhaDyByzmcJpLFKIbZGf3RQ.jpg?st=2024-12-28T13%3A19%3A27Z&se=2024-12-28T15%3A19%3A27Z&sp=r&sv=2024-08-04&sr=b&rscd=inline&rsct=image/png&skoid=d505667d-d6c1-4a0a-bac7-5c84a87759f8&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2024-12-27T21%3A04%3A17Z&ske=2024-12-28T21%3A04%3A17Z&sks=b&skv=2024-08-04&sig=c8lf%2BurRUwfznRY30bGLofv0R5zWbXRsjWGJEMDGNZc%3D",
                ext: "jpg"
            },
            {
                url: "https://oaidalleapiprodscus.blob.core.windows.net/private/org-Lq66WMpkjt7XPM2sn64lhBU4/user-DslhPNO1vHCzab22sduqca8H/img-ZXhaDyByzmcJpLFKIbZGf3RQ.png?st=2024-12-28T13%3A19%3A27Z&se=2024-12-28T15%3A19%3A27Z&sp=r&sv=2024-08-04&sr=b&rscd=inline&rsct=image/png&skoid=d505667d-d6c1-4a0a-bac7-5c84a87759f8&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2024-12-27T21%3A04%3A17Z&ske=2024-12-28T21%3A04%3A17Z&sks=b&skv=2024-08-04&sig=c8lf%2BurRUwfznRY30bGLofv0R5zWbXRsjWGJEMDGNZc%3D",
                ext: "png"
            }
        ]

        const jpeg = "image/jpeg"
        const png = "image/png"

        expect(service.getImageType(files[0].url)).toEqual(jpeg)
        expect(service.getImageType(files[1].url)).toEqual(jpeg)
        expect(service.getImageType(files[2].url)).toEqual(png)
    })

})