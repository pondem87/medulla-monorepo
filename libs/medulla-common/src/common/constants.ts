export const UUID_LENGTH=36
export const MAX_USER_NUMBER_LENGTH=20
export const DEFAULT_MONEY_MULTIPLIER=1_00_000_000n
export const LONG_TEST_TIMEOUT = 45000
export const SHORT_TEST_TIMEOUT = 10000
export const BASE_CURRENCY_ISO="USD"
export const PULA_ISO = "BWP"

export const MESSAGE_FOOTER_TEXT = "Powered by Pfitztronic"

export const NoContactsMessageEventPattern = 'NO_CONTACTS_MESSAGE_TO_PROCESS'
export const MessageEventPattern = 'MESSAGE_TO_PROCESS'
export const MessengerEventPattern = 'MESSAGE_TO_SEND'
export const LLMEventPattern = 'PROMPT_TO_LLM'

export const ZimMobilePaymentMethods: {id: string; title: string; description: string}[] = [
    { id: "econet-paynow", title: "ecocash", description: "Econet Ecocash mobile wallet (USD)" },
    { id: "onemoney-paynow", title: "onemoney", description: "NetOne OneMoney mobile wallet (USD)" },
    { id: "innbucks-paynow", title: "innbucks", description: "Pay with InnBucks" }
]

export const MainMenuItems: {id: string; title: string; description: string}[] = [
    { id: "payments-menu", title: "Recharge Your Account", description: "Buy credits to get access to paid features" },
    { id: "account-details", title: "Account Details", description: "Credit balance, AI models and more..." }
]

export const whatsappRmqClient = "WhatsappRmqClient"
export const llmRmqClient = "LLMRmqClient"