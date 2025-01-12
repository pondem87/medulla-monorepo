export enum PaymentStatus {
    INITIATED = "initiated",
    PENDING = "pending",
    PAID = "paid",
    CANCELLED = "cancelled",
    REFUNDED = "refunded"
}

export enum PaymentMethod {
    MANUAL = "manual",
    ECOCASH = "ecocash",
    ONEMONEY = "onemoney",
    INNBUCKS = "innbucks"
}

export enum PaymentGateway {
    MANUAL = "manual",
    PAYNOW = "paynow"
}

export type PaynowInitPaymentResult = {
    success: boolean;
    message?: string;
    id?: string
}