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

    // If this is a Discord request, turn the JSON into readable text
    if (url.searchParams.get("discord") === "1") {
      try {
        const json = JSON.parse(data);
        const results = json.response || [];

        if (results.length === 0) {
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
          let text = `🌸 **${flower.Flower}**\n`;

          if (flower.Points !== undefined) {
            text += `**Points:** ${flower.Points}\n`;
          }

          if (flower["Upgrade "] !== undefined) {
            text += `**Upgrade:** ${flower["Upgrade "]}\n`;
          }

          if (flower["Upgrade Cost"] !== undefined) {
            text += `**Upgrade Cost:** ${flower["Upgrade Cost"]} 💎\n`;
          }

          if (flower.Owners) {
            text += `**Owners:** ${flower.Owners}`;
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
          `🌸 I found the flower, but couldn't format the results.`,
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

    // Normal API behavior stays unchanged
    return new Response(data, {
      status: response.status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
};
