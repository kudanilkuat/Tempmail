/**
 * Cloudflare Email Worker
 * 
 * This worker receives emails from Cloudflare's catch-all email routing
 * and forwards them to your Next.js webhook endpoint.
 * 
 * Setup Instructions:
 * 1. Create a new Cloudflare Worker in your Cloudflare dashboard
 * 2. Copy this code into the worker
 * 3. Set the following environment variables in the worker settings:
 *    - WEBHOOK_URL: Your Next.js API endpoint (e.g., https://yourdomain.com/api/webhook)
 *    - WEBHOOK_SECRET: A secret token to authenticate requests (same as in your .env)
 * 4. In Cloudflare Email Routing, set up a catch-all rule to forward to this worker
 */

export default {
  async email(message, env, ctx) {
    try {
      // Extract email data
      const rawEmail = await streamToString(message.raw);
      const parsedEmail = parseEmail(rawEmail);

      const emailData = {
        recipient: message.to,
        sender: message.from,
        subject: parsedEmail.subject || "(No Subject)",
        textBody: parsedEmail.textBody || null,
        htmlBody: parsedEmail.htmlBody || null,
      };

      // Send to webhook
      const response = await fetch(env.WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.WEBHOOK_SECRET}`,
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        console.error(`Webhook failed: ${response.status} ${response.statusText}`);
        // Optionally reject the message to trigger retry
        // message.setReject("Webhook failed");
      }
    } catch (error) {
      console.error("Error processing email:", error);
      // Optionally reject the message
      // message.setReject("Processing failed");
    }
  },
};

/**
 * Convert a ReadableStream to a string
 */
async function streamToString(stream) {
  const reader = stream.getReader();
  const chunks = [];
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  
  const concatenated = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    concatenated.set(chunk, offset);
    offset += chunk.length;
  }
  
  return new TextDecoder().decode(concatenated);
}

/**
 * Parse raw email content
 * This is a simplified parser - for production, consider using a library like postal-mime
 */
function parseEmail(rawEmail) {
  const result = {
    subject: "",
    textBody: "",
    htmlBody: "",
  };

  // Split headers and body
  const headerBodySplit = rawEmail.indexOf("\r\n\r\n");
  if (headerBodySplit === -1) {
    return result;
  }

  const headers = rawEmail.substring(0, headerBodySplit);
  const body = rawEmail.substring(headerBodySplit + 4);

  // Extract subject from headers
  const subjectMatch = headers.match(/^Subject:\s*(.+)$/mi);
  if (subjectMatch) {
    result.subject = decodeHeader(subjectMatch[1].trim());
  }

  // Check content type
  const contentTypeMatch = headers.match(/^Content-Type:\s*([^;\r\n]+)/mi);
  const contentType = contentTypeMatch ? contentTypeMatch[1].trim().toLowerCase() : "text/plain";

  // Check for multipart
  const boundaryMatch = headers.match(/boundary="?([^";\r\n]+)"?/i);

  if (boundaryMatch) {
    // Multipart message
    const boundary = boundaryMatch[1];
    const parts = body.split(`--${boundary}`);

    for (const part of parts) {
      if (part.trim() === "" || part.trim() === "--") continue;

      const partHeaderBodySplit = part.indexOf("\r\n\r\n");
      if (partHeaderBodySplit === -1) continue;

      const partHeaders = part.substring(0, partHeaderBodySplit);
      const partBody = part.substring(partHeaderBodySplit + 4).trim();

      const partContentTypeMatch = partHeaders.match(/Content-Type:\s*([^;\r\n]+)/i);
      const partContentType = partContentTypeMatch ? partContentTypeMatch[1].trim().toLowerCase() : "";

      if (partContentType.includes("text/plain") && !result.textBody) {
        result.textBody = decodeBody(partBody, partHeaders);
      } else if (partContentType.includes("text/html") && !result.htmlBody) {
        result.htmlBody = decodeBody(partBody, partHeaders);
      }
    }
  } else {
    // Single part message
    const decodedBody = decodeBody(body, headers);
    if (contentType.includes("text/html")) {
      result.htmlBody = decodedBody;
    } else {
      result.textBody = decodedBody;
    }
  }

  return result;
}

/**
 * Decode header value (handles encoded-word syntax)
 */
function decodeHeader(value) {
  // Handle =?charset?encoding?encoded_text?= format
  const encodedWordPattern = /=\?([^?]+)\?([BQ])\?([^?]*)\?=/gi;
  
  return value.replace(encodedWordPattern, (match, charset, encoding, text) => {
    try {
      if (encoding.toUpperCase() === "B") {
        // Base64
        return atob(text);
      } else if (encoding.toUpperCase() === "Q") {
        // Quoted-printable
        return text
          .replace(/_/g, " ")
          .replace(/=([0-9A-F]{2})/gi, (_, hex) => 
            String.fromCharCode(parseInt(hex, 16))
          );
      }
    } catch (e) {
      return text;
    }
    return text;
  });
}

/**
 * Decode body content based on transfer encoding
 */
function decodeBody(body, headers) {
  const transferEncodingMatch = headers.match(/Content-Transfer-Encoding:\s*([^\r\n]+)/i);
  const transferEncoding = transferEncodingMatch ? transferEncodingMatch[1].trim().toLowerCase() : "";

  if (transferEncoding === "base64") {
    try {
      return atob(body.replace(/[\r\n\s]/g, ""));
    } catch (e) {
      return body;
    }
  } else if (transferEncoding === "quoted-printable") {
    return body
      .replace(/=\r?\n/g, "")
      .replace(/=([0-9A-F]{2})/gi, (_, hex) => 
        String.fromCharCode(parseInt(hex, 16))
      );
  }

  return body;
}
