export function tabForMainTypeName(name) {
  const raw = String(name || "");
  const normalized = raw.toLowerCase();

  // Prefer English keywords (also via name_en from API).
  if (normalized.includes("supervision")) return "supervision";
  if (normalized.includes("training") || normalized.includes("workshop")) {
    return "training";
  }

  // Localized main-type labels used when name_en is unavailable.
  if (
    raw.includes("सुपरविजन") ||
    raw.includes("专业督导") ||
    /penyeliaan/i.test(raw) ||
    raw.includes("மேற்பார்வை")
  ) {
    return "supervision";
  }

  if (
    raw.includes("प्रशिक्षण") ||
    raw.includes("कार्यशाला") ||
    raw.includes("培训") ||
    raw.includes("工作坊") ||
    /latihan|bengkel/i.test(raw) ||
    raw.includes("பயிற்சி") ||
    raw.includes("பட்டறை")
  ) {
    return "training";
  }

  return "counselling";
}

export function buildServiceCardsByTab(types = [], englishTypes = null) {
  const cards = {
    counselling: [],
    supervision: [],
    training: [],
  };

  const englishNameById = new Map();
  (englishTypes || []).forEach((type) => {
    if (type?.id != null) englishNameById.set(Number(type.id), type.name);
  });

  types.forEach((mainType) => {
    const englishName = englishNameById.get(Number(mainType.id));
    const tab = tabForMainTypeName(
      mainType.name_en || englishName || mainType.name
    );
    (mainType.sub_types || []).forEach((sub) => {
      if (sub.is_active === false) return;

      cards[tab].push({
        id: sub.id,
        title: sub.name,
        description: sub.description || "",
        image: sub.image_url || "/assets/card2.jpg.jpeg",
        heading: sub.heading || sub.name,
        parentTypeName: mainType.name,
        appointmentSelection: {
          counsellingTypeId: mainType.id,
          subTypeId: sub.id,
          counsellingTypeName: mainType.name,
          subTypeName: sub.name,
        },
      });
    });
  });

  return cards;
}
