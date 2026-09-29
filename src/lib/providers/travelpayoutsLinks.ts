const TRAVELPAYOUTS_LINKS_ENDPOINT = "https://api.travelpayouts.com/links/v1/create";

type TravelpayoutsLinkResponse = {
  result?: {
    links?: Array<{
      code?: string;
      partner_url?: string;
    }>;
  };
  code?: string;
  status?: number;
};

function configuredAccount() {
  const token = process.env.TRAVELPAYOUTS_API_TOKEN || process.env.TRAVELPAYOUTS_TOKEN;
  const trs = Number(process.env.TRAVELPAYOUTS_TRS_ID);
  const marker = Number(
    process.env.TRAVELPAYOUTS_MARKER_AVIA || process.env.TRAVELPAYOUTS_MARKER,
  );

  if (!token || !Number.isSafeInteger(trs) || !Number.isSafeInteger(marker)) {
    return null;
  }

  return { token, trs, marker };
}

function isAlreadyAttributed(value: URL) {
  const hostname = value.hostname.toLowerCase().replace(/^www\./, "");
  return (
    hostname === "tp.st" ||
    hostname.endsWith(".tp.st") ||
    hostname === "tp.media" ||
    hostname.endsWith(".tp.media") ||
    value.searchParams.has("marker")
  );
}

export async function createTravelpayoutsPartnerLink(args: {
  url: string;
  subId?: string | null;
  shorten?: boolean;
}) {
  let source: URL;
  try {
    source = new URL(args.url);
  } catch {
    return args.url;
  }

  if (source.protocol !== "https:" || isAlreadyAttributed(source)) {
    return args.url;
  }

  const account = configuredAccount();
  if (!account) return args.url;

  try {
    const response = await fetch(TRAVELPAYOUTS_LINKS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Access-Token": account.token,
      },
      body: JSON.stringify({
        trs: account.trs,
        marker: account.marker,
        shorten: args.shorten ?? true,
        links: [
          {
            url: source.toString(),
            ...(args.subId ? { sub_id: args.subId.slice(0, 120) } : {}),
          },
        ],
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(4_000),
    });

    if (!response.ok) return args.url;

    const payload = (await response.json()) as TravelpayoutsLinkResponse;
    const converted = payload.result?.links?.[0];
    if (payload.code !== "success" || converted?.code !== "success" || !converted.partner_url) {
      return args.url;
    }

    const destination = new URL(converted.partner_url);
    return destination.protocol === "https:" ? destination.toString() : args.url;
  } catch {
    // Booking must remain usable if the partner API is unavailable or rate-limited.
    return args.url;
  }
}

export function isTravelpayoutsProvider(value?: string | null) {
  return (value || "").toLowerCase().includes("travelpayouts");
}
