// Meta messages API request body shapes

type RecipientType = "individual"
type MessagingProduct = "whatsapp"

// Text message
export interface TextMessageBody {
    messaging_product: MessagingProduct
    recipient_type: RecipientType
    to: string
    type: "text"
    text: {
        preview_url: boolean
        body: string
    }
}

// Interactive list message
interface Row {
    id: string
    title: string
    description: string
}

interface Section {
    title: string
    rows: Row[]
}

export interface InteractiveList {
    type: "list",
    header: {
        type: "text",
        text: string
    },
    body: {
        text: string
    },
    footer: {
        text: string
    },
    action: {
        sections: Section[]
        button: string
    }
}

export interface InteractiveListMessageBody {
    messaging_product: MessagingProduct
    recipient_type: RecipientType
    to: string
    type: "interactive"
    interactive: InteractiveList
}


// Interactive reply button message
interface ReplyButton {
    type: "reply"
    reply: {
        id: string
        title: string
    }
}

type Header = {
    type: "image",
    image: {
        id: string
    } | {
        link: string
    }
} | {
    type: "document",
    document: {
        id: string
    } | {
        link: string
    }
} | {
    type: "text",
    text: string
}

export interface InteractiveReplyButtons {
    type: "button"
    header: Header
    body: {
        text: string
    }
    footer: {
        text: string
    },
    action: {
        buttons: ReplyButton[]
    }
}

export interface InteractiveReplyButtonsMessageBody {
    messaging_product: MessagingProduct
    recipient_type: RecipientType
    to: string
    type: "interactive",
    interactive: InteractiveReplyButtons
}

// template message
type Parameter = {
    type: "text",
    text: string
}

export type Component = {
    type: "body",
    parameters: Parameter[]
} | {
    type: "button",
    sub_type: "url",
    index: string,
    parameters: Parameter[]
}

export interface TemplateMessageBody {
    messaging_product: MessagingProduct
    recipient_type: RecipientType
    to: string
    type: "template",
    template: {
        name: string,
        language: {
            code: "en_US"
        },
        "components": Component[]
    }
}

// messageBody
export type MessageBody = TemplateMessageBody | InteractiveReplyButtonsMessageBody | InteractiveListMessageBody
    | TextMessageBody


// endpoint response
export type MessagesResponse = {
    messaging_product: MessagingProduct,
    contacts: [
      {
        input: string,
        wa_id: string
      }
    ],
    messages: [
      {
        id: string,
        message_status : "accepted" | "held_for_quality_assessment",
      }
    ]
  }