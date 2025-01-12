import { Type } from "class-transformer";
import { ValidateNested, IsOptional, IsString, IsEnum, IsBoolean, IsNumber, IsInt } from "class-validator";


/*
 *  DTOS FOR PARSING WHATSAPP WEBHOOK PAYLOAD
 *  
 */

// MESSAGES DTO ////////////////////////////////////////////////////////////////////////////////

export class Audio {
    @IsString()
    id: string;

    @IsString()
    mime_type: string;
}

export class Button {
    @IsString()
    payload: string;

    @IsString()
    text: string;
}

class ReferredProduct {
    @IsString()
    catalog_id: string;

    @IsString()
    product_retailer_id: string;
}

export class Context {
    @IsOptional()
    @IsBoolean()
    forwarded?: boolean;

    @IsOptional()
    @IsBoolean()
    frequently_forwarded?: boolean;

    @IsOptional()
    @IsString()
    from?: string;

    @IsOptional()
    @IsString()
    id?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => ReferredProduct)
    referred_product?: ReferredProduct;
}

export class Document {
    @IsOptional()
    @IsString()
    caption?: string;

    @IsString()
    filename: string;

    @IsString()
    sha256: string;

    @IsString()
    mime_type: string;

    @IsString()
    id: string;
}

export class Identity {
    @IsBoolean()
    acknowledged: boolean;

    @IsString()
    created_timestamp: string;

    @IsString()
    hash: string;
}

export class Image {
    @IsOptional()
    @IsString()
    caption?: string;

    @IsString()
    sha256: string;

    @IsString()
    id: string;

    @IsString()
    mime_type: string;
}

class ButtonReply {
    @IsString()
    id: string;

    @IsString()
    title: string;
}

class ListReply {
    @IsString()
    id: string;

    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;
}

export class Interactive {
    @IsEnum(['list_reply', 'button_reply'])
    type: "list_reply" | "button_reply";

    @IsOptional()
    @ValidateNested()
    @Type(() => ButtonReply)
    button_reply?: ButtonReply;

    @IsOptional()
    @ValidateNested()
    @Type(() => ListReply)
    list_reply?: ListReply;
}

export class Location {
    @IsOptional()
    @IsString()
    address?: string
    @IsNumber()
    latitude: number
    @IsNumber()
    longitude: number
    @IsOptional()
    @IsString()
    name?: string
}

export class Order {
    @IsString()
    catalog_id: string;

    @IsString()
    text: string;

    @ValidateNested({ each: true })
    @Type(() => ProductItem)
    product_items: ProductItem[];
}

class ProductItem {
    @IsString()
    product_retailer_id: string;

    @IsString()
    quantity: string;

    @IsString()
    item_price: string;

    @IsString()
    currency: string;
}

export class Referral {
    @IsString()
    source_url: string;

    @IsString()
    source_type: string;

    @IsString()
    source_id: string;

    @IsString()
    headline: string;

    @IsString()
    body: string;

    @IsString()
    media_type: string;

    @IsOptional()
    @IsString()
    image_url?: string;

    @IsOptional()
    @IsString()
    video_url?: string;

    @IsOptional()
    @IsString()
    thumbnail_url?: string;

    @IsString()
    ctwa_clid: string;
}

export class Sticker {
    @IsString()
    mime_type: string;

    @IsString()
    sha256: string;

    @IsString()
    id: string;

    @IsBoolean()
    animated: boolean;
}

export class System {
    @IsString()
    body: string;

    @IsString()
    identity?: string;

    @IsOptional()
    @IsString()
    new_wa_id?: string;

    @IsOptional()
    @IsString()
    wa_id?: string;

    @IsEnum(['user_changed_number', 'user_identity_changed'])
    type: 'user_changed_number' | 'user_identity_changed';

    @IsOptional()
    @IsString()
    customer?: string;
}

export class Text {
    @IsString()
    body: string;
}

export class Video {
    @IsOptional()
    @IsString()
    caption?: string;

    @IsString()
    filename: string;

    @IsString()
    sha256: string;

    @IsString()
    id: string;

    @IsString()
    mime_type: string;
}

export class Messages {
    @IsOptional()
    @ValidateNested()
    @Type(() => Audio)
    audio?: Audio;

    @IsOptional()
    @ValidateNested()
    @Type(() => Button)
    button?: Button;

    @IsOptional()
    @ValidateNested()
    @Type(() => Context)
    context?: Context;

    @IsOptional()
    @ValidateNested()
    @Type(() => Document)
    document?: Document;

    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => Error)
    errors?: Error[];

    @IsOptional()
    @IsString()
    from?: string;

    @IsOptional()
    @IsString()
    id?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => Identity)
    identity?: Identity;

    @IsOptional()
    @ValidateNested()
    @Type(() => Image)
    image?: Image;

    @IsOptional()
    @ValidateNested()
    @Type(() => Interactive)
    interactive?: Interactive;

    @IsOptional()
    @ValidateNested()
    @Type(() => Location)
    location?: Location

    @IsOptional()
    @ValidateNested()
    @Type(() => Order)
    order?: Order;

    @IsOptional()
    @ValidateNested()
    @Type(() => Referral)
    referral?: Referral;

    @IsOptional()
    @ValidateNested()
    @Type(() => Sticker)
    sticker?: Sticker;

    @IsOptional()
    @ValidateNested()
    @Type(() => System)
    system?: System;

    @IsOptional()
    @ValidateNested()
    @Type(() => Text)
    text?: Text;

    @IsOptional()
    @IsString()
    timestamp?: string;

    @IsOptional()
    @IsEnum(['audio', 'button', 'document', 'text', 'image', 'interactive', 'location', 'order', 'sticker', 'system', 'unknown', 'video'])
    type?: 'audio' | 'button' | 'document' | 'text' | 'image' | 'interactive' | 'location' | 'order' | 'sticker' | 'system' | 'unknown' | 'video'

    @IsOptional()
    @ValidateNested()
    @Type(() => Video)
    video?: Video;
}

// CONTACT DTO //////////////////////////////////////////////////////////////////////////////////////

class Profile {
    @IsString()
    name: string;
}

export class Contact {
    @IsString()
    wa_id: string;

    @ValidateNested()
    @Type(() => Profile)
    profile: Profile;
}

// WEBHOOK OBJECT //////////////////////////////////////////////////////////////////////////////////////////////////////

class ErrorData {
    @IsString()
    details: string;
}

export class Error {
    @IsInt()
    code: number;

    @IsString()
    title: string;

    @IsString()
    message: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => ErrorData)
    error_data?: ErrorData;
}

class Origin {
    @IsEnum(['authentication', 'marketing', 'utility', 'service', 'referral_conversion'])
    type: 'authentication' | 'marketing' | 'utility' | 'service' | 'referral_conversion';

    @IsOptional()
    @IsString()
    expiration_timestamp?: string;
}

class Conversation {
    @IsString()
    id: string;

    @ValidateNested()
    @Type(() => Origin)
    origin: Origin;
}

class Pricing {
    @IsBoolean()
    billable: boolean;

    @IsEnum(['authentication', 'marketing', 'utility', 'service', 'referral_conversion'])
    category: 'authentication' | 'marketing' | 'utility' | 'service' | 'referral_conversion';

    @IsEnum(['CBP'])
    pricing_model: 'CBP';
}

export class Statuses {
    @IsOptional()
    @IsString()
    biz_opaque_callback_data?: string;

    @ValidateNested()
    @Type(() => Conversation)
    conversation: Conversation;

    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => Error)
    errors?: Error[];

    @IsString()
    id: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => Pricing)
    pricing?: Pricing;

    @IsString()
    recipient_id: string;

    @IsEnum(['delivered', 'read', 'sent'])
    status: 'delivered' | 'read' | 'sent';

    @IsString()
    timestamp: string;
}

class Metadata {
    @IsString()
    display_phone_number: string;

    @IsString()
    phone_number_id: string;
}

class ChangeValue {
    @IsString()
    messaging_product: string;

    @ValidateNested()
    @Type(() => Metadata)
    metadata: Metadata;

    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => Contact)
    contacts?: Contact[];

    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => Error)
    errors?: Error[];

    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => Messages)
    messages?: Messages[];

    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => Statuses)
    statuses?: Statuses[];
}

export class Change {
    @ValidateNested()
    @Type(() => ChangeValue)
    value: ChangeValue;

    @IsString()
    field: string;
}

export class Entry {
    @IsString()
    id: string;

    @ValidateNested({ each: true })
    @Type(() => Change)
    changes: Change[];
}

export class WhatsAppWebhookPayloadDto {
    @IsString()
    object: string;

    @ValidateNested({ each: true })
    @Type(() => Entry)
    entry: Entry[];
}


/*
 *
 * Meta messages API request body shapes
 * 
 * OBJECTS FOR BUILDING API CALL PAYLOADS FOR WHATSAPP CLOUD API
 *
 */


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

export interface ImageMessageBody {
    messaging_product: MessagingProduct
    recipient_type: RecipientType
    to: string
    type: "image",
    image: {
        id: string
        caption: string
    } | {
        link: string
        caption: string
    }
}

// messageBody
export type MessageBody = TemplateMessageBody | InteractiveReplyButtonsMessageBody | InteractiveListMessageBody
    | TextMessageBody | ImageMessageBody


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
            message_status: "accepted" | "held_for_quality_assessment",
        }
    ]
}