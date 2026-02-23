import { MEMZO_API_URL, STORAGE_KEYS } from "@/lib/constants";
import type { Collection, SessionUser } from "@/lib/types";

async function getToken(): Promise<string | null> {
  const result = await storage.getItem<string>(
    `local:${STORAGE_KEYS.TOKEN}`
  );
  return result;
}

async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${MEMZO_API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });

  if (res.status === 401) {
    await storage.removeItem(`local:${STORAGE_KEYS.TOKEN}`);
    await storage.removeItem(`local:${STORAGE_KEYS.USER}`);
    throw new Error("Token expired");
  }

  return res;
}

export async function login(
  email: string,
  password: string
): Promise<{ token: string; user: SessionUser }> {
  const res = await fetch(`${MEMZO_API_URL}/api/ext/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Login failed");
  }

  const data = await res.json();
  await storage.setItem(`local:${STORAGE_KEYS.TOKEN}`, data.token);
  await storage.setItem(`local:${STORAGE_KEYS.USER}`, data.user);
  return data;
}

export async function logout(): Promise<void> {
  await storage.removeItem(`local:${STORAGE_KEYS.TOKEN}`);
  await storage.removeItem(`local:${STORAGE_KEYS.USER}`);
  await storage.removeItem(`local:${STORAGE_KEYS.SELECTED_COLLECTION}`);
}

export async function getAuthState(): Promise<{
  user: SessionUser | null;
  token: string | null;
}> {
  const token = await getToken();
  const user = await storage.getItem<SessionUser>(
    `local:${STORAGE_KEYS.USER}`
  );
  return { user: token ? user : null, token };
}

export async function getCollections(): Promise<Collection[]> {
  const res = await authFetch("/api/ext/collections");
  if (!res.ok) throw new Error("Failed to fetch collections");
  return res.json();
}

export async function createCollection(title: string): Promise<Collection> {
  const res = await authFetch("/api/ext/collections", {
    method: "POST",
    body: JSON.stringify({ title, description: "" }),
  });
  if (!res.ok) throw new Error("Failed to create collection");
  return res.json();
}

export async function saveCard(
  collectionId: string,
  front: string,
  back: string
): Promise<void> {
  const res = await authFetch(`/api/ext/collections/${collectionId}/cards`, {
    method: "POST",
    body: JSON.stringify({ cards: [{ front, back }] }),
  });
  if (!res.ok) throw new Error("Failed to save card");

  // Track recent words
  const key = `local:${STORAGE_KEYS.RECENT_WORDS}`;
  const recent =
    (await storage.getItem<{ front: string; back: string; savedAt: number }[]>(
      key
    )) || [];
  recent.unshift({ front, back, savedAt: Date.now() });
  await storage.setItem(key, recent.slice(0, 50));
}
