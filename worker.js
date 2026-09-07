export default {
  async fetch(request) {
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";

    const appsScriptUrl =
      "https://script.google.com/macros/s/AKfycbxFRpQhZpsMd1KO3qC1lh8TERgZnBUtfrCedDbOKHoW0DO1SaI1HFWig3SzE50wPZFPIw/exec" +
      "?search=" + encodeURIComponent(search);

    const response = await fetch(appsScriptUrl, {
      redirect: "follow"
    });

    const data = await response.text();

    // Discord-friendly version
    if (url.searchParams.get("discord") === "1") {
      try {
        const parsed = JSON.parse(data);

        // Google Apps Script returns { response: [...] }
        const results = Array.isArray(parsed)
          ? parsed
          : (parsed.response || []);

        if (!Array.isArray(results) || results.length === 0) {
          return new Response(
            `🌸 No flower found for **${search}**.`,
            {
              status: 200,
              headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Access-Control-Allow-Origin": "*"
              }
            }
          );
        }

        const message = results.map(flower => {
          let text = `🌸 **${flower.Flower || "Unknown Flower"}**`;

          if (flower.Points !== undefined) {
            text += `\n**Points:** ${flower.Points}`;
          }

          if (flower["Upgrade "] !== undefined) {
            text += `\n**Upgrade:** ${flower["Upgrade "]}`;
          }

          if (flower["Upgrade Cost"] !== undefined) {
            text += `\n**Upgrade Cost:** ${flower["Upgrade Cost"]} 💎`;
          }

          if (flower.Owners) {
            text += `\n**Owners:** ${flower.Owners}`;
          }

          return text;
        }).join("\n\n");

        return new Response(message, {
          status: 200,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Access-Control-Allow-Origin": "*"
          }
        });

      } catch (error) {
        return new Response(
          `🌸 Error formatting the flower data: ${error.message}`,
          {
            status: 500,
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Access-Control-Allow-Origin": "*"
            }
          }
        );
      }
    }

    // Normal API response — unchanged
    return new Response(data, {
      status: response.status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
};
