export function tabForMainTypeName(name) {
  const normalized = String(name || "").toLowerCase();
  if (normalized.includes("supervision")) return "supervision";
  if (normalized.includes("training") || normalized.includes("workshop")) return "training";
  return "counselling";
}

export function buildServiceCardsByTab(types = []) {
  const cards = {
    counselling: [],
    supervision: [],
    training: [],
  };

  types.forEach((mainType) => {
    const tab = tabForMainTypeName(mainType.name);
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
          counsellingTypeName: mainType.name,
          subTypeName: sub.name,
        },
      });
    });
  });

  return cards;
}
