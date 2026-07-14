export const normalizeSignTerm = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-_]/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
};

export const searchForSign = (searchString, signs, synonyms = {}) => {
  const searchTerm = normalizeSignTerm(searchString);
  if (!searchTerm) {
    return null;
  }

  const exactNameMatch = signs.find((sign) => normalizeSignTerm(sign.name) === searchTerm);
  if (exactNameMatch) {
    return exactNameMatch;
  }

  const exactSlugMatch = signs.find((sign) => normalizeSignTerm(sign.slug) === searchTerm);
  if (exactSlugMatch) {
    return exactSlugMatch;
  }

  const synonymTargetSlug = synonyms[searchTerm];
  if (typeof synonymTargetSlug === "string") {
    const normalizedTarget = normalizeSignTerm(synonymTargetSlug);
    const synonymMatch = signs.find((sign) =>
      normalizeSignTerm(sign.name) === normalizedTarget ||
      normalizeSignTerm(sign.slug) === normalizedTarget
    );
    if (synonymMatch) {
      return synonymMatch;
    }
  }

  const nameStartsWithSearchTerm = signs.filter((sign) =>
    normalizeSignTerm(sign.name).startsWith(searchTerm)
  );
  if (nameStartsWithSearchTerm.length === 1) {
    return nameStartsWithSearchTerm[0];
  }

  return null;
};
