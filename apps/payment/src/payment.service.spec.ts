import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { ConfigService } from '@nestjs/config';
import { Payment } from './entities/payment.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PollPayment } from './entities/pollpayment.entity';
import { PaymentMethod, PaymentStatus } from './types';
import { PaynowPaymentDetailsDto } from './dto/PaynowPaymentDetailsDto.dto';
import { SubscriptionService } from './subscription/subscription.service';
import { randomUUID } from 'crypto';
import { Paynow } from "better-paynow";
import { mockedLoggingService } from '@app/medulla-common/common/mocks';
import { whatsappRmqClient } from '@app/medulla-common/common/constants';

const paymentAddFunc = jest.fn()
const createPaymentFunc = jest.fn().mockImplementation(() => {
    return {
        add: paymentAddFunc
    }
})
let sendMobileFunc = null

jest.mock("better-paynow", () => {
    return {
        Paynow: jest.fn().mockImplementation(() => {
            return {
                createPayment: createPaymentFunc,
                sendMobile: sendMobileFunc
            }
        })
    }
})

const create = jest.fn().mockImplementation((obj) => ({ obj }))
const save = jest.fn().mockImplementation(async (obj) => ({ id: randomUUID(), ...obj }))

describe('PaymentController', () => {
    let paymentService: PaymentService;

    const mockConfigService = {
        get: jest.fn().mockImplementation((key) => {
            switch (key) {
                case "PAYNOW_INTEGRATION_ID":
                    return "PAYNOW_INTEGRATION_ID"
                case "PAYNOW_INTEGRATION_KEY":
                    return "PAYNOW_INTEGRATION_KEY"
                case "PAYNOW_RESULT_URL":
                    return "PAYNOW_RESULT_URL"
                default:
                    return null
            }
        })
    }

    const mockPaymentRepo = {
        create,
        save
    }
    const mockPollPaymentRepo = {
        create,
        save
    }
    const mockSubscriptionService = {}

    const mockWhatAppClient = {}

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            providers: [
                PaymentService,
                {
                    provide: LoggingService,
                    useValue: mockedLoggingService
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService
                },
                {
                    provide: getRepositoryToken(Payment),
                    useValue: mockPaymentRepo
                },
                {
                    provide: getRepositoryToken(PollPayment),
                    useValue: mockPollPaymentRepo
                },
                {
                    provide: SubscriptionService,
                    useValue: mockSubscriptionService
                },
                {
                    provide: whatsappRmqClient,
                    useValue: mockWhatAppClient
                }
            ],
        }).compile();

        paymentService = app.get<PaymentService>(PaymentService);
    });

    afterEach(() => {
        (Paynow as jest.Mock).mockClear()
        paymentAddFunc.mockClear()
    })

    it('should be defined', () => {
        expect(paymentService).toBeDefined();
    });

    it('should return "Server Active!"', () => {
        expect(paymentService.getHealth()).toBe('Server Active!');
    });

    it('should convert paynow status to internal status', () => {
        expect(paymentService.reassignPaynowStatus("Paid")).toEqual(PaymentStatus.PAID)
        expect(paymentService.reassignPaynowStatus("Awaiting Delivery")).toEqual(PaymentStatus.PAID)
        expect(paymentService.reassignPaynowStatus("Delivered")).toEqual(PaymentStatus.PAID)
        expect(paymentService.reassignPaynowStatus("Created")).toEqual(PaymentStatus.PENDING)
        expect(paymentService.reassignPaynowStatus("Sent")).toEqual(PaymentStatus.PENDING)
        expect(paymentService.reassignPaynowStatus("Disputed")).toEqual(PaymentStatus.PENDING)
        expect(paymentService.reassignPaynowStatus("Cancelled")).toEqual(PaymentStatus.CANCELLED)
        expect(paymentService.reassignPaynowStatus("Refunded")).toEqual(PaymentStatus.REFUNDED)
    })

    it('initialise mobile payment, successful response', async () => {
        const input: PaynowPaymentDetailsDto = {
            userId: "26776323310",
            product: "medulla",
            method: PaymentMethod.ECOCASH,
            mobile: "0775409679",
            amount: 1,
            email: "tpp@gmail.com"
        }

        // set up sendMobile mock
        sendMobileFunc = jest.fn().mockResolvedValue({
            success: true,
            instructions: "how to complete the payment",
            pollUrl: "url-to-check-payment",
            paynowReference: "some-unique-id"
        })

        const result = await paymentService.initializePaynowMobile(input)

        expect(result?.success).toBe(true)
        expect(result).toEqual({
            success: true,
            id: expect.any(String),
            message: "how to complete the payment"
        })
        expect(Paynow).toHaveBeenCalledWith(
            "PAYNOW_INTEGRATION_ID", "PAYNOW_INTEGRATION_KEY", "PAYNOW_RESULT_URL", null
        )
        expect(createPaymentFunc).toHaveBeenCalledTimes(1)
        expect(createPaymentFunc).toHaveBeenCalledWith(expect.any(String), input.email)
        expect(paymentAddFunc).toHaveBeenCalledTimes(1)
        expect(paymentAddFunc).toHaveBeenCalledWith(input.product, input.amount)
        expect(sendMobileFunc).toHaveBeenCalledTimes(1)
        expect(sendMobileFunc).toHaveBeenCalledWith(
            expect.objectContaining({ add: expect.any(Function) }), input.mobile, input.method
        )
    })

    it('initialise mobile payment, paynow failure', async () => {
        const input: PaynowPaymentDetailsDto = {
            userId: "26776323310",
            product: "medulla",
            method: PaymentMethod.ECOCASH,
            mobile: "0775409679",
            amount: 1,
            email: "tpp@gmail.com"
        }

        // set up sendMobile mock
        sendMobileFunc = jest.fn().mockResolvedValue({
            success: false,
            error: "made up error"
        })

        const result = await paymentService.initializePaynowMobile(input)

        expect(result?.success).toBe(false)
    })
});