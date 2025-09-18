// Helper to call the server
export async function callChatAPI(message: string, conversationId: string) {
  try {
    const res = await fetch("/web", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation_id: conversationId, message }),
    });
    if (!res.ok) throw new Error(`Chat API error: ${res.status}`);
    return res.json();
  } catch (err) {
    console.error("Error sending message:", err);
    return null;
  }
}

export type ConfigFile = {
  name: string;
  content: string;
};

export async function getConfigFiles(): Promise<ConfigFile[]> {
  try {
    const res = await fetch("/api/config");
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  } catch (err) {
    console.error("Error fetching config files:", err);
    return [];
  }
}

export async function saveConfigFile(file: ConfigFile): Promise<boolean> {
  try {
    const res = await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(file),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return true;
  } catch (err) {
    console.error("Error saving config file:", err);
    return false;
  }
}
