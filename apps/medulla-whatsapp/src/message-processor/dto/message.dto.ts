import { Type } from "class-transformer";
import { ValidateNested, IsOptional, IsString, IsEnum, IsBoolean, IsNumber } from "class-validator";

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
    @IsBoolean()
    @IsOptional()
    forwarded?: boolean;

    @IsBoolean()
    @IsOptional()
    frequently_forwarded?: boolean;

    @IsString()
    @IsOptional()
    from?: string;

    @IsString()
    @IsOptional()
    id?: string;

    @ValidateNested()
    @IsOptional()
    @Type(() => ReferredProduct)
    referred_product?: ReferredProduct;
}

export class Document {
    @IsString()
    @IsOptional()
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
    @IsString()
    @IsOptional()
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

    @IsString()
    @IsOptional()
    description?: string;
}

export class Interactive {
    @IsEnum(['list_reply', 'button_reply'])
    type: "list_reply" | "button_reply";

    @ValidateNested()
    @IsOptional()
    @Type(() => ButtonReply)
    button_reply?: ButtonReply;

    @ValidateNested()
    @IsOptional()
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

    @IsString()
    @IsOptional()
    image_url?: string;

    @IsString()
    @IsOptional()
    video_url?: string;

    @IsString()
    @IsOptional()
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
    identity: string;

    @IsString()
    @IsOptional()
    new_wa_id?: string;

    @IsString()
    @IsOptional()
    wa_id?: string;

    @IsEnum(['customer_changed_number', 'customer_identity_changed'])
    type: 'customer_changed_number' | 'customer_identity_changed';

    @IsString()
    customer: string;
}

export class Text {
    @IsString()
    body: string;
}

export class Video {
    @IsString()
    @IsOptional()
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
    @ValidateNested()
    @IsOptional()
    @Type(() => Audio)
    audio?: Audio;

    @ValidateNested()
    @IsOptional()
    @Type(() => Button)
    button?: Button;

    @ValidateNested()
    @IsOptional()
    @Type(() => Context)
    context?: Context;

    @ValidateNested()
    @IsOptional()
    @Type(() => Document)
    document?: Document;

    @ValidateNested({ each: true })
    @IsOptional()
    @Type(() => Error)
    errors?: Error[];

    @IsString()
    @IsOptional()
    from?: string;

    @IsString()
    @IsOptional()
    id?: string;

    @ValidateNested()
    @IsOptional()
    @Type(() => Identity)
    identity?: Identity;

    @ValidateNested()
    @IsOptional()
    @Type(() => Image)
    image?: Image;

    @ValidateNested()
    @IsOptional()
    @Type(() => Interactive)
    interactive?: Interactive;

    @ValidateNested()
    @IsOptional()
    @Type(() => Location)
    location?: Location

    @ValidateNested()
    @IsOptional()
    @Type(() => Order)
    order?: Order;

    @ValidateNested()
    @IsOptional()
    @Type(() => Referral)
    referral?: Referral;

    @ValidateNested()
    @IsOptional()
    @Type(() => Sticker)
    sticker?: Sticker;

    @ValidateNested()
    @IsOptional()
    @Type(() => System)
    system?: System;

    @ValidateNested()
    @IsOptional()
    @Type(() => Text)
    text?: Text;

    @IsString()
    @IsOptional()
    timestamp?: string;

    @IsEnum(['audio', 'button', 'document', 'text', 'image', 'interactive', 'location', 'order', 'sticker', 'system', 'unknown', 'video'])
    @IsOptional()
    type?: 'audio' | 'button' | 'document' | 'text' | 'image' | 'interactive' | 'location' | 'order' | 'sticker' | 'system' | 'unknown' | 'video'

    @ValidateNested()
    @IsOptional()
    @Type(() => Video)
    video?: Video;
}