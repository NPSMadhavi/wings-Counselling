export const NAV_SCROLL_OFFSET = 100;

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
