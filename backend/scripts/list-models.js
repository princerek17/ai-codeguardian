const { GoogleGenerativeAI } = require("@google/generative-ai");

const key = process.env.GOOGLE_AI_API_KEY;
if (!key) {
  console.error("Missing GOOGLE_AI_API_KEY in environment");
  process.exit(1);
}

async function main() {
  const genAI = new GoogleGenerativeAI(key);

  // This uses the SDK’s internal endpoint to list models if available.
  // If your SDK version doesn't support listModels directly, we’ll update the SDK.
  if (typeof genAI.listModels !== "function") {
    console.error("This SDK version doesn't expose listModels(). Update @google/generative-ai.");
    process.exit(1);
  }

  const models = await genAI.listModels();
  for (const m of models.models || models) {
    console.log(m.name, m.supportedGenerationMethods || "");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
