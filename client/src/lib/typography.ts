// Typographic non-breaking spaces: a short word must never be the last word on
// a line ("не" / "в" / "и" ...), so it is glued to the word that follows.
const NBSP = " ";

const WORDS: Record<string, string> = {
  // prepositions, conjunctions and particles of up to 3 letters
  ru: "в|к|с|у|о|и|а|но|на|не|по|за|из|от|до|во|со|об|ни|ли|же|бы|ко|для|при|без|над|под|про|или",
  es: "a|e|o|u|y|de|en|el|la|lo|un|se|su|al|es|me|mi|tu|no|ni|con|por|del|las|los|una|que|sin",
};

const patterns = new Map<string, RegExp>();

function pattern(lang: string): RegExp | null {
  const words = WORDS[lang];
  if (!words) return null;
  let re = patterns.get(lang);
  if (!re) {
    // (start or non-letter) + short word + one plain space
    re = new RegExp(`(?<![\\p{L}\\p{N}])(${words})[ ]+(?=\\S)`, "giu");
    patterns.set(lang, re);
  }
  return re;
}

export function bindShortWords(text: string, lang: string): string {
  const re = pattern(lang);
  let out = text;
  if (re) {
    // twice, so that "и в" / "а не" chains glue together
    out = out.replace(re, `$1${NBSP}`).replace(re, `$1${NBSP}`);
  }
  // a dash never starts a line
  return out.replace(/ ([—–]) /g, `${NBSP}$1 `);
}
