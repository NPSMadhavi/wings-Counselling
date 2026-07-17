export const NAV_SCROLL_OFFSET = 100;

const PAGE_CONTENT_TARGETS = {
  "/about-us": { id: "journey-section" },
  "/team": { id: "team-section" },
  "/services": { id: "services-tabs" },
  "/events": { id: "events-section" },
  "/articles": { id: "featured-articles" },
  "/volunteer": { selector: "main > section:nth-of-type(2)" },
  "/partners": { id: "partners-section" },
  "/career": { id: "open-positions" },
  "/careers": { id: "open-positions" },
};

function scrollToElement(el, { behavior = "auto", offset = NAV_SCROLL_OFFSET } = {}) {
  if (!el) return false;

  const top = el.getBoundingClientRect().top + window.scrollY - offset;

  window.scrollTo({
    top: Math.max(0, top),
    behavior,
  });

  return true;
}

export function scrollToPageContentSection(
  path,
  { behavior = "auto", offset = NAV_SCROLL_OFFSET } = {}
) {
  const basePath = path.split("?")[0].split("#")[0];
  const target = PAGE_CONTENT_TARGETS[basePath];

  if (!target) return false;

  const attempt = () => {
    if (target.id) {
      return scrollToElement(document.getElementById(target.id), { behavior, offset });
    }

    if (target.selector) {
      return scrollToElement(document.querySelector(target.selector), {
        behavior,
        offset,
      });
    }

    return false;
  };

  if (attempt()) return true;

  setTimeout(attempt, 100);
  setTimeout(attempt, 350);
  return true;
}

export function scrollToContactSection({ behavior = "smooth", updateHash = true } = {}) {
  const contactEl = document.getElementById("contact");
  if (!contactEl) return false;

  if (updateHash) {
    window.history.replaceState(null, "", "/#contact");
  }

  const top =
    contactEl.getBoundingClientRect().top + window.scrollY - NAV_SCROLL_OFFSET;

  window.scrollTo({
    top: Math.max(0, top),
    behavior,
  });

  return true;
}

export function scrollToContactWithRetry() {
  const attempt = () => scrollToContactSection();

  if (!attempt()) {
    setTimeout(attempt, 100);
    setTimeout(attempt, 350);
    return;
  }

  setTimeout(attempt, 100);
  setTimeout(attempt, 350);
}

export function scrollToPartnersSection({ behavior = "smooth", updateHash = true } = {}) {
  const partnersEl = document.getElementById("partners");
  if (!partnersEl) return false;

  if (updateHash) {
    window.history.replaceState(null, "", "/#partners");
  }

  const top =
    partnersEl.getBoundingClientRect().top + window.scrollY - NAV_SCROLL_OFFSET;

  window.scrollTo({
    top: Math.max(0, top),
    behavior,
  });

  return true;
}

export function scrollToPartnersWithRetry() {
  const attempt = () => scrollToPartnersSection();

  if (!attempt()) {
    setTimeout(attempt, 100);
    setTimeout(attempt, 350);
    return;
  }

  setTimeout(attempt, 100);
  setTimeout(attempt, 350);
}
