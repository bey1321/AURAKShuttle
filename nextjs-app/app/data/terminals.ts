import { Terminal } from "../data/types";
import { adminAPI } from "../lib/api";

// Convert backend terminal to frontend format
function mapTerminalToFrontend(terminal: any): Terminal {
  return {
    id: terminal.id,
    terminalName: terminal.terminalName,
    city: terminal.city,
    terminal: terminal.terminalName, // For backward compatibility
  };
}

// Fetch terminals from backend
export async function getTerminals(): Promise<Terminal[]> {
  try {
    const data = await adminAPI.getTerminals();
    return data.map(mapTerminalToFrontend);
  } catch (error) {
    console.error("Error fetching terminals:", error);
    throw error;
  }
}

// Legacy export for backward compatibility
export const terminals: Terminal[] = [];
