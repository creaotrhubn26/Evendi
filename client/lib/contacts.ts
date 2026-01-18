import * as Contacts from "expo-contacts";

export interface ContactResult {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  source: "contacts";
}

export async function requestContactsPermission(): Promise<boolean> {
  try {
    const { status } = await Contacts.requestPermissionsAsync();
    return status === "granted";
  } catch (error) {
    console.error("Error requesting contacts permission:", error);
    return false;
  }
}

export async function searchContacts(query: string): Promise<ContactResult[]> {
  try {
    if (!query.trim()) return [];

    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
    });

    if (!data) return [];

    const results: ContactResult[] = [];
    const lowerQuery = query.toLowerCase();

    for (const contact of data) {
      if (contact.name && contact.name.toLowerCase().includes(lowerQuery)) {
        // Get first phone and email
        const phone = contact.phoneNumbers?.[0]?.number;
        const email = contact.emails?.[0]?.email;

        results.push({
          id: contact.id,
          name: contact.name,
          phone,
          email,
          source: "contacts",
        });
      }

      if (results.length >= 10) break; // Limit to 10 results
    }

    return results;
  } catch (error) {
    console.error("Error searching contacts:", error);
    return [];
  }
}
