import { IsBoolean, IsInt, IsOptional, IsString, ValidateNested, IsEnum, IsNumber } from "class-validator";
import { Type } from "class-transformer";

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

  @ValidateNested()
  @IsOptional()
  @Type(() => ErrorData)
  error_data?: ErrorData;
}



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

  @ValidateNested()
  @IsOptional()
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
  identity: string;

  
  @IsOptional()
  @IsString()
  new_wa_id?: string;

  
  @IsOptional()
  @IsString()
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

  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => Error)
  errors?: Error[];

  @IsString()
  id: string;

  @ValidateNested()
  @IsOptional()
  @Type(() => Pricing)
  pricing?: Pricing;

  @IsString()
  recipient_id: string;

  @IsEnum(['delivered', 'read', 'sent'])
  status: 'delivered' | 'read' | 'sent';

  @IsString()
  timestamp: string;
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

  
  @IsOptional()
  @IsString()
  from?: string;

  
  @IsOptional()
  @IsString()
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

  @IsOptional()
  @IsString()
  timestamp?: string;

  @IsEnum(['audio', 'button', 'document', 'text', 'image', 'interactive', 'location' , 'order', 'sticker', 'system', 'unknown', 'video'])
  @IsOptional()
  type?: 'audio' | 'button' | 'document' | 'text' | 'image' | 'interactive' | 'location' | 'order' | 'sticker' | 'system' | 'unknown' | 'video'

  @ValidateNested()
  @IsOptional()
  @Type(() => Video)
  video?: Video;
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

  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => Contact)
  contacts?: Contact[];

  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => Error)
  errors?: Error[];

  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => Messages)
  messages?: Messages[];

  @ValidateNested({ each: true })
  @IsOptional()
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

export class WebhookPayloadDto {
  @IsString()
  object: string;

  @ValidateNested({ each: true })
  @Type(() => Entry)
  entry: Entry[];
}
