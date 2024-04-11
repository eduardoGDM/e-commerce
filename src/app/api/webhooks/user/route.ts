import prisma from "@/lib/prisma";
import { EmailAddress } from "@clerk/nextjs/server";
import { IncomingHttpHeaders } from "http";
import { HeadersAdapter } from "next/dist/server/web/spec-extension/adapters/headers";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook, WebhookRequiredHeaders } from "svix";

const WebhookSecret = process.env.CLERK_WEBHOOK_SECRETE || "";

type EventType = "user.created" | "user.updated" | "*";

type Event = {
  data: EventDataType;
  object: "event";
  type: EventType;
};

type EventDataType = {
  //dados do evento de usuario
  id: string;
  first_name: string;
  last_name: string;
  email_adresses: EmailAddressType[];
  primary_email_address_id: string;
  attributes: Record<string, string | number>;
};

type EmailAddressType = {
  //dados do evento de email
  id: string;
  email_address: string;
};
async function handler(request: Request) {
  const payload = await request.json();
  const headersList = headers();
  const heads = {
    //info do cabeçalho
    "svix-id": headersList.get("svix-id"),
    "svix-timestamp": headersList.get("svix-timestamp"),
    "svix-signature": headersList.get("svix-signature"),
  };
  const wh = new Webhook(WebhookSecret); //criar um objeto webhook
  let evt: Event | null = null;

  try {
    evt = wh.verify(
      JSON.stringify(payload),
      heads as IncomingHttpHeaders & WebhookRequiredHeaders
    ) as Event;
  } catch (err) {
    console.log((err as Error).message);
    return NextResponse.json({}, { status: 400 });
  }
  const eventType: EventType = evt.type;
  if (evt.type === "user.created" || eventType === "user.updated") {
    const {
      id,
      first_name,
      last_name,
      email_adresses,
      primary_email_address_id,
      ...attributes
    } = evt.data;

    await prisma.user.upsert({
      where: { externalId: id as string },
      create: {
        externalId: id as string,
        attributes,
      },
      update: {
        attributes,
      },
    });
  }
  return NextResponse.json({}, { status: 200 });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
