// Sakura Scribe Worker
// Original search API + Sakura Grimoire Discord autocomplete

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxFRpQhZpsMd1KO3qC1lh8TERgZnBUtfrCedDbOKHoW0DO1SaI1HFWig3SzE50wPZFPIw/exec";

export default {
  async fetch(request, env) {

    const url = new URL(request.url);

    // =========================================================
    // DISCORD INTERACTIONS
    // =========================================================

    if (url.pathname === "/register") {
  const response = await fetch(
    `https://discord.com/api/v10/applications/${env.DISCORD_GRIMOIRE_APP_ID}/guilds/${env.DISCORD_GRIMOIRE_GUILD_ID}/commands`,
    {
      method: "PUT",
      headers: {
        "Authorization": `Bot ${env.DISCORD_GRIMOIRE_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify([{
        name: "search",
        description: "Search the Sakura flower database",
        options: [
          {
            type: 3,
            name: "flower",
            description: "Flower name",
            required: true,
            autocomplete: true
          }
        ]
      }])
    }
  );

  return new Response(await response.text(), {
    status: response.status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
  if (request.method === "POST") {

     const body = await request.text();

let interaction;

try {
  interaction = JSON.parse(body);
} catch {
  return new Response("Invalid JSON", {
    status: 400
  });
}

// Verify Discord signature

const isValid = await verifyDiscordRequest(
  body,
  request.headers.get("X-Signature-Ed25519"),
  request.headers.get("X-Signature-Timestamp"),
  env.DISCORD_GRIMOIRE_PUBLIC_KEY
);

if (!isValid) {
  return new Response("Invalid request signature", {
    status: 401
  });
}

// Discord's initial verification PING

if (interaction.type === 1) {

  return jsonResponse({
    type: 1
  });

}

      // ---------------------------------------------------------
      // AUTOCOMPLETE
      // ---------------------------------------------------------

      if (interaction.type === 4) {

        const focusedOption =
          interaction.data?.options?.find(option => option.focused);

        const searchText =
          focusedOption?.value?.toString() || "";

        const results = await getFlowerResults(searchText);

        const choices = results
          .map(flower => flower.Flower)
          .filter(Boolean)
          .filter((name, index, array) =>
            array.indexOf(name) === index
          )
          .slice(0, 25)
          .map(name => ({
            name: name.substring(0, 100),
            value: name.substring(0, 100)
          }));

        return jsonResponse({
          type: 8,
          data: {
            choices
          }
        });
      }

      // ---------------------------------------------------------
      // NORMAL /search COMMAND
      // ---------------------------------------------------------

      if (interaction.type === 2) {

        const option =
          interaction.data?.options?.find(
            option => option.name === "flower"
          );

        const flowerName =
          option?.value?.toString() || "";

        const results =
          await getFlowerResults(flowerName);

        if (!results.length) {
          return jsonResponse({
            type: 4,
            data: {
              content:
                `🌸 No flower found for **${flowerName}**.`
            }
          });
        }

        const message = results.map(flower => {

          let text =
            `🌸 **${flower.Flower || "Unknown Flower"}**`;

          if (flower.Points !== undefined) {
            text += `\n**Points:** ${flower.Points}`;
          }

          if (flower["Upgrade "] !== undefined) {
            text += `\n**Upgrade:** ${flower["Upgrade "]}`;
          }

          if (flower["Upgrade Cost"] !== undefined) {
            text +=
              `\n**Upgrade Cost:** ${flower["Upgrade Cost"]} 💎`;
          }

          if (flower.Owners) {
            text +=
              `\n**Owners:** ${flower.Owners}`;
          }

          return text;

        }).join("\n\n");

        return jsonResponse({
          type: 4,
          data: {
            content: message
          }
        });
      }

      return new Response("Unsupported interaction", {
        status: 400
      });
    }

    // =========================================================
    // EXISTING GOOGLE SHEETS SEARCH
    // =========================================================

    const search =
      url.searchParams.get("search") || "";

    const appsScriptUrl =
      APPS_SCRIPT_URL +
      "?search=" +
      encodeURIComponent(search);

    const response = await fetch(appsScriptUrl, {
      redirect: "follow"
    });

    const data = await response.text();

    // Existing Discord formatting route
    if (url.searchParams.get("discord") === "1") {

      try {

        const parsed = JSON.parse(data);

        const results =
          Array.isArray(parsed)
            ? parsed
            : parsed.response || [];

        if (
          !Array.isArray(results) ||
          results.length === 0
        ) {
          return new Response(
            `🌸 No flower found for **${search}**.`,
            {
              status: 200,
              headers: {
                "Content-Type":
                  "text/plain; charset=utf-8",
                "Access-Control-Allow-Origin": "*"
              }
            }
          );
        }

        const message = results.map(flower => {

          let text =
            `🌸 **${flower.Flower || "Unknown Flower"}**`;

          if (flower.Points !== undefined) {
            text += `\n**Points:** ${flower.Points}`;
          }

          if (flower["Upgrade "] !== undefined) {
            text +=
              `\n**Upgrade:** ${flower["Upgrade "]}`;
          }

          if (flower["Upgrade Cost"] !== undefined) {
            text +=
              `\n**Upgrade Cost:** ${flower["Upgrade Cost"]} 💎`;
          }

          if (flower.Owners) {
            text +=
              `\n**Owners:** ${flower.Owners}`;
          }

          return text;

        }).join("\n\n");

        return new Response(message, {
          status: 200,
          headers: {
            "Content-Type":
              "text/plain; charset=utf-8",
            "Access-Control-Allow-Origin": "*"
          }
        });

      } catch (error) {

        return new Response(
          `🌸 Error formatting the flower data: ${error.message}`,
          {
            status: 500,
            headers: {
              "Content-Type":
                "text/plain; charset=utf-8",
              "Access-Control-Allow-Origin": "*"
            }
          }
        );
      }
    }

    return new Response(data, {
      status: response.status,
      headers: {
        "Content-Type":
          "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
};


// =============================================================
// GET FLOWERS FROM GOOGLE SHEETS
// =============================================================

async function getFlowerResults(searchText) {

  const response = await fetch(
    APPS_SCRIPT_URL +
    "?search=" +
    encodeURIComponent(searchText || ""),
    {
      redirect: "follow"
    }
  );

  if (!response.ok) {
    return [];
  }

  try {

    const data = await response.json();

    return Array.isArray(data)
      ? data
      : data.response || [];

  } catch {
    return [];
  }
}


// =============================================================
// DISCORD SIGNATURE VERIFICATION
// =============================================================

async function verifyDiscordRequest(
  body,
  signature,
  timestamp,
  publicKey
) {

  try {

    const message =
      new TextEncoder().encode(
        timestamp + body
      );

    const signatureBytes =
      hexToBytes(signature);

    const publicKeyBytes =
      hexToBytes(publicKey);

    const key =
      await crypto.subtle.importKey(
        "raw",
        publicKeyBytes,
        {
          name: "Ed25519"
        },
        false,
        ["verify"]
      );

    return await crypto.subtle.verify(
      {
        name: "Ed25519"
      },
      key,
      signatureBytes,
      message
    );

  } catch (error) {

    console.error(
      "Discord signature verification failed:",
      error
    );

    return false;
  }
}


// =============================================================
// HEX → BYTES
// =============================================================

function hexToBytes(hex) {

  const bytes =
    new Uint8Array(hex.length / 2);

  for (let i = 0; i < bytes.length; i++) {

    bytes[i] =
      parseInt(
        hex.substring(i * 2, i * 2 + 2),
        16
      );
  }

  return bytes;
}


// =============================================================
// JSON RESPONSE
// =============================================================

function jsonResponse(data) {

  return new Response(
    JSON.stringify(data),
    {
      status: 200,
      headers: {
        "Content-Type":
          "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      }
    }
  );
}
